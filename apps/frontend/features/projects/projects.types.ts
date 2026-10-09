export type Project = {
  id: string
  githubInstallationId: string | null
  name: string
  slug: string
  repoOwner: string
  repoName: string
  repoUrl: string
  branch: string
  createdAt: string
  updatedAt: string
  envVars: Array<{
    id: string
    key: string
    value: string
    createdAt: string
    updatedAt: string
  }>
  deployments: Array<{
    id: string
    status:
      | "QUEUED"
      | "BUILDING"
      | "BUILD_FAILED"
      | "STARTING"
      | "RUNNING"
      | "RUNTIME_FAILED"
    branch: string
    hostPort: number | null
    containerId: string | null
    buildLogs: string | null
    runtimeLogs: string | null
    lastError: string | null
    createdAt: string
    updatedAt: string
  }>
}

export type ProjectsResponse = {
  projects: Project[]
}

export type ProjectResponse = {
  project: Project
}

export type CreateProjectPayload = {
  githubInstallationId?: string
  githubRepositoryId?: string
  name: string
  repoOwner: string
  repoName: string
  repoUrl: string
  branch: string
}

export type CreateProjectResponse = {
  project: Project
}

export type DeployProjectResponse = {
  deployment: Project["deployments"][number]
}

export type DeleteProjectResponse = void

export type UpdateProjectEnvVarsPayload = {
  envVars: Array<{
    key: string
    value: string
  }>
}
