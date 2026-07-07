import { decryptString, encryptString } from "../../lib/encryption"
import { prisma } from "../../lib/prisma"
import { deleteProjectDeployments } from "../deployments/deployments.service"

type CreateProjectInput = {
  userId: string
  name: string
  repoOwner: string
  repoName: string
  repoUrl: string
  branch: string
  githubInstallationId?: string
  githubRepositoryId?: string
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function buildUniqueSlug(name: string) {
  const baseSlug = slugify(name) || "project"
  let slug = baseSlug
  let count = 1

  while (await prisma.project.findUnique({ where: { slug } })) {
    count += 1
    slug = `${baseSlug}-${count}`
  }

  return slug
}

export async function createProject(input: CreateProjectInput) {
  const slug = await buildUniqueSlug(input.name)

  const installation = input.githubInstallationId
    ? await prisma.gitHubInstallation.findFirst({
        where: {
          id: input.githubInstallationId,
          userId: input.userId,
          status: "ACTIVE",
          deletedAt: null,
        },
      })
    : await prisma.gitHubInstallation.findFirst({
        where: {
          userId: input.userId,
          status: "ACTIVE",
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
      })

  if (!installation) {
    throw new Error("Connect a GitHub installation before creating a project.")
  }

  return prisma.project.create({
    data: {
      userId: input.userId,
      githubInstallationId: installation.id,
      githubRepositoryId: input.githubRepositoryId?.trim() || null,
      name: input.name.trim(),
      slug,
      repoOwner: input.repoOwner.trim(),
      repoName: input.repoName.trim(),
      repoUrl: input.repoUrl.trim(),
      branch: input.branch.trim(),
    },
  })
}

export async function listProjects(userId: string) {
  return prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      githubInstallation: true,
      deployments: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  })
}

export async function getProject(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    include: {
      githubInstallation: true,
      envVars: {
        orderBy: { key: "asc" },
      },
      deployments: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!project) {
    return null
  }

  return {
    ...project,
    envVars: project.envVars.map((envVar) => ({
      id: envVar.id,
      key: envVar.key,
      value: decryptString(envVar.encryptedValue),
      createdAt: envVar.createdAt,
      updatedAt: envVar.updatedAt,
    })),
  }
}

export async function updateProjectEnvVars(
  projectId: string,
  userId: string,
  envVars: Array<{ key: string; value: string }>
) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
  })

  if (!project) {
    throw new Error("Project not found.")
  }

  const cleanedEnvVars = envVars
    .map((envVar) => ({
      key: envVar.key.trim(),
      value: envVar.value,
    }))
    .filter((envVar) => envVar.key.length > 0)

  const seenKeys = new Set<string>()

  for (const envVar of cleanedEnvVars) {
    if (!/^[A-Z_][A-Z0-9_]*$/i.test(envVar.key)) {
      throw new Error(`Invalid environment variable key: ${envVar.key}`)
    }

    const normalizedKey = envVar.key.toUpperCase()

    if (seenKeys.has(normalizedKey)) {
      throw new Error(`Duplicate environment variable key: ${envVar.key}`)
    }

    seenKeys.add(normalizedKey)
  }

  await prisma.$transaction(async (tx) => {
    await tx.projectEnvironmentVar.deleteMany({
      where: { projectId: project.id },
    })

    if (cleanedEnvVars.length > 0) {
      await tx.projectEnvironmentVar.createMany({
        data: cleanedEnvVars.map((envVar) => ({
          projectId: project.id,
          key: envVar.key,
          encryptedValue: encryptString(envVar.value),
        })),
      })
    }
  })

  return getProject(project.id, userId)
}

export async function deleteProject(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
  })

  if (!project) {
    throw new Error("Project not found.")
  }

  await deleteProjectDeployments(project.id, userId)
  await prisma.project.delete({
    where: { id: project.id },
  })
}
