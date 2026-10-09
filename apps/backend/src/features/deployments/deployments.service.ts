import { spawn } from "node:child_process"
import { rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { prisma } from "@mini-vercel/database"
import { deploymentQueue } from "@mini-vercel/queue"
import { createInstallationAccessToken } from "../github/github.service"

const DEPLOYMENTS_ROOT = join(tmpdir(), "mini-vercel", "deployments")

type DeploymentProject = Awaited<ReturnType<typeof getProjectForDeployment>>

type GitHubPushEventPayload = {
  projectId: string
  installationId: string
  repositoryId: string
  branch: string
  commitSha: string
}

async function getProjectForDeployment(projectId: string, userId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, userId },
    include: { envVars: true, githubInstallation: true },
  })
}

function normalizeCloneUrl(repoUrl: string) {
  const cloneUrl = new URL(repoUrl)
  if (!cloneUrl.pathname.endsWith(".git")) {
    cloneUrl.pathname = `${cloneUrl.pathname}.git`
  }
  return cloneUrl.toString()
}

async function buildCloneUrl(project: NonNullable<DeploymentProject>) {
  if (!project.githubInstallation?.githubInstallationId) {
    return normalizeCloneUrl(project.repoUrl)
  }
  const token = await createInstallationAccessToken(project.githubInstallation.githubInstallationId)
  const cloneUrl = new URL(normalizeCloneUrl(project.repoUrl))
  cloneUrl.username = "x-access-token"
  cloneUrl.password = token.token
  return cloneUrl.toString()
}

function buildImageTag(projectId: string) {
  return `mini-vercel:${projectId}-${Date.now()}`
}

async function cleanupDeploymentResources(deployment: { id: string; containerId?: string | null }) {
  const containerRef = deployment.containerId?.trim() || `mini-vercel-${deployment.id}`
  await new Promise<void>((resolve) => {
    const child = spawn("docker", ["rm", "-f", containerRef], { stdio: "ignore" })
    child.on("close", () => resolve())
    child.on("error", () => resolve())
  })
  await rm(join(DEPLOYMENTS_ROOT, deployment.id), { force: true, recursive: true }).catch(() => {})
}

export async function startProjectDeployment(projectId: string, userId: string) {
  const project = await getProjectForDeployment(projectId, userId)

  if (!project) {
    throw new Error("Project not found.")
  }

  if (!project.githubInstallation) {
    throw new Error("GitHub installation not found for project.")
  }

  const cloneUrl = await buildCloneUrl(project)

  const deployment = await prisma.deployment.create({
    data: {
      projectId: project.id,
      branch: project.branch,
      status: "QUEUED",
      imageTag: buildImageTag(project.id),
    },
  })

  await deploymentQueue.add("deployment-job", { deploymentId: deployment.id, cloneUrl })

  return deployment
}

export async function handleGithubPushDeployment(payload: GitHubPushEventPayload) {
  const existing = await prisma.deployment.findFirst({
    where: {
      projectId: payload.projectId,
      branch: payload.branch,
      commitSha: payload.commitSha,
    },
  })

  if (existing) {
    return
  }

  const project = await prisma.project.findFirst({
    where: {
      id: payload.projectId,
      githubInstallation: { githubInstallationId: payload.installationId },
      githubRepositoryId: payload.repositoryId,
      branch: payload.branch,
    },
    include: { envVars: true, githubInstallation: true },
  })

  if (!project) {
    return
  }

  const cloneUrl = await buildCloneUrl(project)

  const deployment = await prisma.deployment.create({
    data: {
      projectId: payload.projectId,
      branch: payload.branch,
      commitSha: payload.commitSha,
      status: "QUEUED",
      imageTag: buildImageTag(payload.projectId),
    },
  })

  await deploymentQueue.add("deployment-job", { deploymentId: deployment.id, cloneUrl })

  return deployment
}

export async function deleteDeploymentForUser(deploymentId: string, userId: string) {
  const deployment = await prisma.deployment.findFirst({
    where: { id: deploymentId, project: { userId } },
  })

  if (!deployment) {
    throw new Error("Deployment not found.")
  }

  await cleanupDeploymentResources(deployment)
  await prisma.deployment.delete({ where: { id: deployment.id } })
}

export async function deleteProjectDeployments(projectId: string, userId: string) {
  const deployments = await prisma.deployment.findMany({
    where: { projectId, project: { userId } },
  })

  for (const deployment of deployments) {
    await cleanupDeploymentResources(deployment)
  }
}
