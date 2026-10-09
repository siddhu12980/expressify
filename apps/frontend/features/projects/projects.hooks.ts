"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createProject,
  deleteDeployment,
  deleteProject,
  deployProject,
  getProject,
  getProjects,
  updateProjectEnvVars,
} from "./projects.api"
import type {
  CreateProjectPayload,
  ProjectResponse,
  ProjectsResponse,
  UpdateProjectEnvVarsPayload,
} from "./projects.types"
import { useAuthStore } from "@/stores/auth-store"

export const projectKeys = {
  all: ["projects"] as const,
  list: () => [...projectKeys.all, "list"] as const,
  detail: (projectId: string) => [...projectKeys.all, "detail", projectId] as const,
}

export function useProjectsQuery() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: getProjects,
    enabled: isAuthenticated,
    refetchInterval: (query) => {
      const projects = (query.state.data as ProjectsResponse | undefined)?.projects ?? []
      const hasActiveDeployment = projects.some((project) => {
        const latest = project.deployments[0]

        return latest
          ? ["QUEUED", "BUILDING", "STARTING", "RUNNING"].includes(latest.status)
          : false
      })

      return hasActiveDeployment ? 3_000 : false
    },
  })
}

export function useProjectQuery(projectId?: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return useQuery({
    queryKey: projectId
      ? projectKeys.detail(projectId)
      : [...projectKeys.all, "detail", "none"],
    queryFn: () => getProject(projectId!),
    enabled: isAuthenticated && Boolean(projectId),
    refetchInterval: (query) => {
      const project = (query.state.data as ProjectResponse | undefined)?.project
      const latest = project?.deployments[0]

      return latest &&
        ["QUEUED", "BUILDING", "STARTING", "RUNNING"].includes(latest.status)
        ? 2_500
        : false
    },
  })
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => createProject(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectKeys.all })
    },
  })
}

export function useDeployProjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (projectId: string) => deployProject(projectId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectKeys.all })
    },
  })
}

export function useUpdateProjectEnvVarsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      projectId,
      payload,
    }: {
      projectId: string
      payload: UpdateProjectEnvVarsPayload
    }) => updateProjectEnvVars(projectId, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: projectKeys.all })
      await queryClient.invalidateQueries({
        queryKey: projectKeys.detail(variables.projectId),
      })
    },
  })
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (projectId: string) => deleteProject(projectId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectKeys.all })
    },
  })
}

export function useDeleteDeploymentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { projectId: string; deploymentId: string }) =>
      deleteDeployment(input.projectId, input.deploymentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectKeys.all })
    },
  })
}
