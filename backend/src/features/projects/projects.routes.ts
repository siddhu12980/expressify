import { Router } from "express"

import {
  authMiddleware,
  type AuthenticatedRequest,
} from "../../middleware/auth"
import { createProject, listProjects } from "./projects.service"

export const projectsRouter = Router()

projectsRouter.use(authMiddleware)

function parseCreateProjectBody(body: unknown) {
  const input = body as {
    name?: unknown
    repoOwner?: unknown
    repoName?: unknown
    repoUrl?: unknown
    branch?: unknown
    githubInstallationId?: unknown
    githubRepositoryId?: unknown
  }

  if (
    typeof input?.name !== "string" ||
    typeof input?.repoOwner !== "string" ||
    typeof input?.repoName !== "string" ||
    typeof input?.repoUrl !== "string" ||
    typeof input?.branch !== "string"
  ) {
    return null
  }

  return {
    name: input.name,
    repoOwner: input.repoOwner,
    repoName: input.repoName,
    repoUrl: input.repoUrl,
    branch: input.branch,
    githubInstallationId:
      typeof input.githubInstallationId === "string"
        ? input.githubInstallationId
        : undefined,
    githubRepositoryId:
      typeof input.githubRepositoryId === "string"
        ? input.githubRepositoryId
        : undefined,
  }
}

projectsRouter.get("/", async (req, res) => {
  const authReq = req as AuthenticatedRequest
  const projects = await listProjects(authReq.auth!.userId)

  res.json({ projects })
})

projectsRouter.post("/", async (req, res) => {
  const authReq = req as AuthenticatedRequest
  const input = parseCreateProjectBody(req.body)

  if (!input) {
    return res.status(400).json({
      error:
        "name, repoOwner, repoName, repoUrl, and branch are required.",
    })
  }

  try {
    const project = await createProject({
      userId: authReq.auth!.userId,
      ...input,
    })

    return res.status(201).json({ project })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create project."

    return res.status(400).json({ error: message })
  }
})
