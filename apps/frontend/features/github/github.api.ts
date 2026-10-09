import { apiFetch, getApiBaseUrl } from "@/lib/api"

import type {
  GitHubInstallationsResponse,
  GitHubRepositoriesResponse,
  SyncGitHubInstallationResponse,
} from "./github.types"

export function getGitHubInstallations() {
  return apiFetch<GitHubInstallationsResponse>("/github/installations")
}

export function getGitHubRepositories(installationId: string) {
  const params = new URLSearchParams({ installationId })

  return apiFetch<GitHubRepositoriesResponse>(
    `/github/repositories?${params.toString()}`
  )
}

export function getGitHubInstallStartUrl(returnTo = "/dashboard/new-project") {
  return apiFetch<{ url: string }>("/github/install/start", {
    method: "POST",
    body: JSON.stringify({ returnTo }),
  })
}

export function syncGitHubInstallation(installationId: string) {
  return apiFetch<SyncGitHubInstallationResponse>("/github/installations/sync", {
    method: "POST",
    body: JSON.stringify({ installationId }),
  })
}

export function getGitHubAuthStartUrl() {
  return `${getApiBaseUrl()}/auth/github/start`
}
