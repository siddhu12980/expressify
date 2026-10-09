"use client"

import { useMutation, useQuery } from "@tanstack/react-query"

import {
  getGitHubAuthStartUrl,
  getGitHubInstallations,
  getGitHubRepositories,
  getGitHubInstallStartUrl,
  syncGitHubInstallation,
} from "./github.api"
import { useAuthStore } from "@/stores/auth-store"

export const githubKeys = {
  all: ["github"] as const,
  installations: () => [...githubKeys.all, "installations"] as const,
  repositories: (installationId: string) =>
    [...githubKeys.all, "repositories", installationId] as const,
}

export function useGitHubInstallationsQuery() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return useQuery({
    queryKey: githubKeys.installations(),
    queryFn: getGitHubInstallations,
    enabled: isAuthenticated,
  })
}

export function useGitHubInstallStartMutation() {
  return useMutation({
    mutationFn: (returnTo?: string) => getGitHubInstallStartUrl(returnTo),
  })
}

export function useGitHubRepositoriesQuery(installationId?: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return useQuery({
    queryKey: installationId
      ? githubKeys.repositories(installationId)
      : [...githubKeys.all, "repositories", "none"],
    queryFn: () => getGitHubRepositories(installationId!),
    enabled: isAuthenticated && Boolean(installationId),
  })
}

export function useSyncGitHubInstallationMutation() {
  return useMutation({
    mutationFn: (installationId: string) => syncGitHubInstallation(installationId),
  })
}

export function startGitHubAuth() {
  window.location.assign(getGitHubAuthStartUrl())
}
