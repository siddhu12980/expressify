import { spawn } from "node:child_process"
import { constants as fsConstants } from "node:fs"
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import net from "node:net"
import { tmpdir } from "node:os"
import { join } from "node:path"



const DEPLOYMENTS_ROOT = join(tmpdir(), "mini-vercel", "deployments")
const LOG_LIMIT = 100_000


type CommandResult = {
    stdout: string
    stderr: string
    combined: string
  }

  type CommandOptions = {
    cwd?: string
    env?: NodeJS.ProcessEnv
    onOutput?: (chunk: string) => void
  }
  
  
async function executeLocalDeployment(deploymentId: string) {
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: {
        project: {
          include: {
            envVars: true,
            githubInstallation: true,
          },
        },
      },
    })
  
    if (!deployment) {
      return
    }
  
    const workdir = join(DEPLOYMENTS_ROOT, deployment.id)
    const sourceDir = join(workdir, "source")
    const envFilePath = join(workdir, ".env.runtime")
    const imageTag = deployment.imageTag ?? buildImageTag(deployment.projectId)
  
    let buildLogBuffer = ""
  
    try {
      await updateDeployment(deployment.id, {
        status: "BUILDING",
        imageTag,
        buildLogs: "",
        runtimeLogs: "",
        lastError: null,
        containerId: null,
        hostPort: null,
      })
  
      await mkdir(sourceDir, { recursive: true })
  
      await cloneRepo(deployment.project, sourceDir, (chunk) => {
        buildLogBuffer = appendLog(buildLogBuffer, chunk)
      })
      await validateProjectSource(sourceDir)
      await ensureDockerfile(sourceDir)
  
      await runCommand(
        "docker",
        ["build", "-t", imageTag, sourceDir],
        {
          onOutput: (chunk) => {
            buildLogBuffer = appendLog(buildLogBuffer, chunk)
          },
        }
      )
  
      await updateDeployment(deployment.id, {
        buildLogs: buildLogBuffer,
        status: "STARTING",
      })
    } catch (error) {
      await updateDeployment(deployment.id, {
        status: "BUILD_FAILED",
        buildLogs: buildLogBuffer,
        lastError:
          error instanceof Error ? error.message : "Build phase failed.",
      })
      return
    }
  
    let containerName = `mini-vercel-${deployment.id}`
  
    try {
      const hostPort = await getFreePort()
      await writeRuntimeEnvFile(envFilePath, deployment.project.envVars)
  
      const runResult = await runCommand("docker", [
        "run",
        "-d",
        "--name",
        containerName,
        "--env-file",
        envFilePath,
        "-p",
        `${hostPort}:3000`,
        imageTag,
      ])
  
      const containerId = runResult.stdout.trim()
  
      if (!containerId) {
        throw new Error("Docker did not return a container id.")
      }
  
      const isRunning = await checkContainerRunning(containerName)
  
      if (!isRunning) {
        const logsResult = await runCommand("docker", ["logs", containerName])
        throw new Error(
          logsResult.combined.trim() || "Container exited immediately after start."
        )
      }
  
      await updateDeployment(deployment.id, {
        status: "RUNNING",
        containerId,
        hostPort,
        runtimeLogs: "",
        lastError: null,
      })
  
      streamRuntimeLogs(containerName, deployment.id)
      watchContainerExit(containerName, deployment.id)
    } catch (error) {
      const runtimeLogs = await safeReadContainerLogs(containerName)
  
      await updateDeployment(deployment.id, {
        status: "RUNTIME_FAILED",
        runtimeLogs,
        lastError:
          error instanceof Error ? error.message : "Container failed to start.",
      })
    }
  }