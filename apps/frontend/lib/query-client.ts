"use client"

import { QueryClient } from "@tanstack/react-query"

declare global {
  interface Window {
    __miniVercelQueryClient?: QueryClient
  }
}

function shouldRetry(failureCount: number, error: unknown) {
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? (error as { status?: number }).status
      : undefined

  if (status === 401 || status === 403) {
    return false
  }

  return failureCount < 2
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: shouldRetry,
      },
      mutations: {
        retry: shouldRetry,
      },
    },
  })
}

export function getQueryClient() {
  if (typeof window === "undefined") {
    return createQueryClient()
  }

  window.__miniVercelQueryClient ??= createQueryClient()

  return window.__miniVercelQueryClient
}
