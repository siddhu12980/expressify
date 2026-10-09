import { spawn } from "node:child_process"
import { constants as fsConstants } from "node:fs"
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import net from "node:net"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { decryptString } from "@mini-vercel/crypto"
import { prisma } from "@mini-vercel/database"

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

export async function executeLocalDeployment(deploymentId: string, cloneUrl: string) {
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

    await cloneRepo(deployment.project.branch, sourceDir, cloneUrl, (chunk) => {
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
      lastError: error instanceof Error ? error.message : "Build phase failed.",
    })
    return
  }

  const containerName = `mini-vercel-${deployment.id}`

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
      lastError: error instanceof Error ? error.message : "Container failed to start.",
    })
  }
}

async function cloneRepo(
  branch: string,
  sourceDir: string,
  cloneUrl: string,
  onOutput?: (chunk: string) => void
) {
  await runCommand(
    "git",
    ["clone", "--depth=1", "--branch", branch, cloneUrl, sourceDir],
    { onOutput }
  )
}

async function validateProjectSource(sourceDir: string) {
  const packageJsonPath = join(sourceDir, "package.json")

  await access(packageJsonPath, fsConstants.F_OK).catch(() => {
    throw new Error("package.json not found in repository root.")
  })

  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
    scripts?: { start?: unknown }
  }

  if (typeof packageJson.scripts?.start !== "string" || !packageJson.scripts.start.trim()) {
    throw new Error('package.json must define a "start" script.')
  }
}

async function ensureDockerfile(sourceDir: string) {
  const dockerfilePath = join(sourceDir, "Dockerfile")
  const hasDockerfile = await access(dockerfilePath, fsConstants.F_OK)
    .then(() => true)
    .catch(() => false)

  if (hasDockerfile) {
    return
  }

  await writeFile(
    dockerfilePath,
    [
      "FROM node:lts-slim",
      "WORKDIR /app",
      "COPY package*.json ./",
      "RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi",
      "COPY . .",
      "ENV PORT=3000",
      "EXPOSE 3000",
      'CMD ["npm", "start"]',
      "",
    ].join("\n"),
    "utf8"
  )
}

async function writeRuntimeEnvFile(
  envFilePath: string,
  envVars: Array<{ key: string; encryptedValue: string }>
) {
  const lines = envVars
    .filter((envVar) => envVar.key.trim().toUpperCase() !== "PORT")
    .map((envVar) => {
      const value = decryptString(envVar.encryptedValue).replace(/\n/g, "\\n")
      return `${envVar.key}=${value}`
    })

  lines.push("PORT=3000")

  await writeFile(envFilePath, `${lines.join("\n")}\n`, {
    encoding: "utf8",
    mode: 0o600,
  })
}

async function runCommand(
  command: string,
  args: string[],
  options: CommandOptions = {}
) {
  return new Promise<CommandResult>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      stdio: ["ignore", "pipe", "pipe"],
    })

    let stdout = ""
    let stderr = ""

    child.stdout.on("data", (chunk: Buffer | string) => {
      const text = chunk.toString()
      stdout = appendLog(stdout, text)
      options.onOutput?.(text)
    })

    child.stderr.on("data", (chunk: Buffer | string) => {
      const text = chunk.toString()
      stderr = appendLog(stderr, text)
      options.onOutput?.(text)
    })

    child.on("error", (error) => {
      reject(error)
    })

    child.on("close", (code) => {
      const combined = appendLog(stdout, stderr)

      if (code === 0) {
        resolve({ stdout, stderr, combined })
        return
      }

      reject(
        new Error(
          combined.trim() || `${command} ${args.join(" ")} exited with code ${code ?? "unknown"}.`
        )
      )
    })
  })
}

async function checkContainerRunning(containerName: string) {
  try {
    const result = await runCommand("docker", [
      "inspect",
      "--format={{.State.Running}}",
      containerName,
    ])
    return result.stdout.trim() === "true"
  } catch {
    return false
  }
}

function streamRuntimeLogs(containerName: string, deploymentId: string) {
  const child = spawn("docker", ["logs", "-f", containerName], {
    stdio: ["ignore", "pipe", "pipe"],
  })

  let buffer = ""
  let scheduledFlush: NodeJS.Timeout | null = null

  const flush = () => {
    scheduledFlush = null
    void updateDeployment(deploymentId, { runtimeLogs: buffer })
  }

  const onChunk = (chunk: Buffer | string) => {
    buffer = appendLog(buffer, chunk.toString())
    if (!scheduledFlush) {
      scheduledFlush = setTimeout(flush, 500)
    }
  }

  child.stdout.on("data", onChunk)
  child.stderr.on("data", onChunk)

  child.on("close", () => {
    if (scheduledFlush) {
      clearTimeout(scheduledFlush)
      scheduledFlush = null
    }
    void updateDeployment(deploymentId, { runtimeLogs: buffer })
  })
}

function watchContainerExit(containerName: string, deploymentId: string) {
  const child = spawn("docker", ["wait", containerName], {
    stdio: ["ignore", "pipe", "pipe"],
  })

  let output = ""

  child.stdout.on("data", (chunk: Buffer | string) => { output += chunk.toString() })
  child.stderr.on("data", (chunk: Buffer | string) => { output += chunk.toString() })

  child.on("close", () => {
    const exitCode = Number(output.trim())

    if (Number.isNaN(exitCode) || exitCode === 0) {
      return
    }

    void (async () => {
      const deployment = await prisma.deployment.findUnique({ where: { id: deploymentId } })

      if (!deployment || deployment.status !== "RUNNING") {
        return
      }

      const runtimeLogs = await safeReadContainerLogs(containerName)

      await updateDeployment(deploymentId, {
        status: "RUNTIME_FAILED",
        runtimeLogs,
        lastError: `Container exited with code ${exitCode}.`,
      })
    })()
  })
}

async function safeReadContainerLogs(containerName: string) {
  try {
    const result = await runCommand("docker", ["logs", containerName])
    return result.combined
  } catch (error) {
    return error instanceof Error ? error.message : ""
  }
}

async function getFreePort() {
  return new Promise<number>((resolve, reject) => {
    const server = net.createServer()

    server.listen(0, "127.0.0.1", () => {
      const address = server.address()

      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("Unable to reserve a free port.")))
        return
      }

      server.close((error) => {
        if (error) {
          reject(error)
          return
        }
        resolve(address.port)
      })
    })

    server.on("error", reject)
  })
}

function buildImageTag(projectId: string) {
  return `mini-vercel:${projectId}-${Date.now()}`
}

function appendLog(current: string, next: string) {
  const value = `${current}${next}`
  if (value.length <= LOG_LIMIT) {
    return value
  }
  return value.slice(value.length - LOG_LIMIT)
}

async function updateDeployment(
  deploymentId: string,
  data: Partial<{
    status: "QUEUED" | "BUILDING" | "BUILD_FAILED" | "STARTING" | "RUNNING" | "RUNTIME_FAILED"
    imageTag: string | null
    containerId: string | null
    hostPort: number | null
    buildLogs: string | null
    runtimeLogs: string | null
    lastError: string | null
  }>
) {
  await prisma.deployment.update({ where: { id: deploymentId }, data })
}
