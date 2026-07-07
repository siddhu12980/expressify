import { Router } from "express"

import {
  authMiddleware,
  type AuthenticatedRequest,
} from "../../middleware/auth"
import {
  deleteDeploymentForUser,
  startProjectDeployment,
} from "../deployments/deployments.service"
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProjectEnvVars,
} from "./projects.service"

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

function parseEnvVarsBody(body: unknown) {
  const input = body as {
    envVars?: Array<{
      key?: unknown
      value?: unknown
    }>
  }

  if (!Array.isArray(input?.envVars)) {
    return null
  }

  const envVars = input.envVars.map((envVar) => {
    if (
      typeof envVar?.key !== "string" ||
      typeof envVar?.value !== "string"
    ) {
      return null
    }

    return {
      key: envVar.key,
      value: envVar.value,
    }
  })

  if (envVars.some((envVar) => envVar === null)) {
    return null
  }

  return envVars as Array<{ key: string; value: string }>
}

projectsRouter.get("/", async (req, res) => {
  const authReq = req as AuthenticatedRequest
  const projects = await listProjects(authReq.auth!.userId)

  res.json({ projects })
})

projectsRouter.get("/:projectId", async (req, res) => {
  const authReq = req as AuthenticatedRequest
  const projectId = req.params.projectId

  if (!projectId) {
    return res.status(400).json({ error: "projectId is required." })
  }

  const project = await getProject(projectId, authReq.auth!.userId)

  if (!project) {
    return res.status(404).json({ error: "Project not found." })
  }

  return res.json({ project })
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

projectsRouter.post("/:projectId/deploy", async (req, res) => {
  const authReq = req as AuthenticatedRequest
  const projectId = req.params.projectId

  if (!projectId) {
    return res.status(400).json({ error: "projectId is required." })
  }

  try {
    const deployment = await startProjectDeployment(
      projectId,
      authReq.auth!.userId
    )

    return res.status(202).json({ deployment })
  } catch (error) {
    return res.status(400).json({
      error:
        error instanceof Error ? error.message : "Unable to start deployment.",
    })
  }
})

projectsRouter.put("/:projectId/env-vars", async (req, res) => {
  const authReq = req as AuthenticatedRequest
  const projectId = req.params.projectId
  const envVars = parseEnvVarsBody(req.body)

  if (!projectId) {
    return res.status(400).json({ error: "projectId is required." })
  }

  if (!envVars) {
    return res.status(400).json({
      error: "envVars must be an array of { key, value }.",
    })
  }

  try {
    const project = await updateProjectEnvVars(
      projectId,
      authReq.auth!.userId,
      envVars
    )

    return res.json({ project })
  } catch (error) {
    return res.status(400).json({
      error:
        error instanceof Error
          ? error.message
          : "Unable to update environment variables.",
    })
  }
})

projectsRouter.delete("/:projectId", async (req, res) => {
  const authReq = req as AuthenticatedRequest
  const projectId = req.params.projectId

  if (!projectId) {
    return res.status(400).json({ error: "projectId is required." })
  }

  try {
    await deleteProject(projectId, authReq.auth!.userId)
    return res.status(204).send()
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : "Unable to delete project.",
    })
  }
})

projectsRouter.delete(
  "/:projectId/deployments/:deploymentId",
  async (req, res) => {
    const authReq = req as AuthenticatedRequest
    const deploymentId = req.params.deploymentId

    if (!deploymentId) {
      return res.status(400).json({ error: "deploymentId is required." })
    }

    try {
      await deleteDeploymentForUser(deploymentId, authReq.auth!.userId)
      return res.status(204).send()
    } catch (error) {
      return res.status(400).json({
        error:
          error instanceof Error ? error.message : "Unable to delete deployment.",
      })
    }
  }
)
