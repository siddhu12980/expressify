import { prisma } from "../../lib/prisma"

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
