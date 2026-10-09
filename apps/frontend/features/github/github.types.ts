export type GitHubInstallation = {
  id: string
  githubInstallationId: string
  githubAccountLogin: string
  githubAccountType: string
  targetType: string
  repositoriesMode: string | null
  status: "ACTIVE" | "SUSPENDED" | "REMOVED"
}

export type GitHubInstallationsResponse = {
  installations: GitHubInstallation[]
}

export type SyncGitHubInstallationResponse = {
  installation: GitHubInstallation
}

export type GitHubRepository = {
  id: string
  name: string
  fullName: string
  repoUrl: string
  defaultBranch: string
  ownerLogin: string
}

export type GitHubRepositoriesResponse = {
  repositories: GitHubRepository[]
}

export function getGitHubInstallationConfigureUrl(
  installation: GitHubInstallation
) {
  if (installation.githubAccountType.toLowerCase() === "organization") {
    return `https://github.com/organizations/${installation.githubAccountLogin}/settings/installations/${installation.githubInstallationId}`
  }

  return `https://github.com/settings/installations/${installation.githubInstallationId}`
}
