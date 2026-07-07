import { prisma } from "../../lib/prisma"

type CreateProjectInput = {
  userId: string
  name: string
  repoOwner: string
  repoName: string
  repoUrl: string
  branch: string
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

  return prisma.project.create({
    data: {
      userId: input.userId,
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
      deployments: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  })
}
