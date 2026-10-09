import { apiFetch } from "@/lib/api"

import type {
  CreateProjectPayload,
  CreateProjectResponse,
  DeleteProjectResponse,
  DeployProjectResponse,
  ProjectResponse,
  ProjectsResponse,
  UpdateProjectEnvVarsPayload,
} from "./projects.types"

export function getProjects() {
  return apiFetch<ProjectsResponse>("/projects")
}

export function getProject(projectId: string) {
  return apiFetch<ProjectResponse>(`/projects/${projectId}`)
}

export function createProject(payload: CreateProjectPayload) {
  return apiFetch<CreateProjectResponse>("/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function deployProject(projectId: string) {
  return apiFetch<DeployProjectResponse>(`/projects/${projectId}/deploy`, {
    method: "POST",
  })
}

export function updateProjectEnvVars(
  projectId: string,
  payload: UpdateProjectEnvVarsPayload
) {
  return apiFetch<ProjectResponse>(`/projects/${projectId}/env-vars`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export function deleteProject(projectId: string) {
  return apiFetch<DeleteProjectResponse>(`/projects/${projectId}`, {
    method: "DELETE",
  })
}

export function deleteDeployment(projectId: string, deploymentId: string) {
  return apiFetch<DeleteProjectResponse>(
    `/projects/${projectId}/deployments/${deploymentId}`,
    {
      method: "DELETE",
    }
  )
}
