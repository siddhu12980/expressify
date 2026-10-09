"use client"

import { useAuthStore } from "@/stores/auth-store"

const DEFAULT_API_BASE_URL = "http://localhost:8080/api"

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

export function getApiBaseUrl() {
  if (typeof window !== "undefined") {
    const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(
      /\/$/,
      ""
    )

    if (configuredBaseUrl) {
      return configuredBaseUrl
    }
  }

  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
    DEFAULT_API_BASE_URL
  )
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = useAuthStore.getState().token
  const headers = new Headers(init?.headers)

  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json")
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  })

  const data = (await response.json().catch(() => null)) as {
    error?: string
  } | null

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      useAuthStore.getState().clearSession()
    }

    throw new ApiError(
      data?.error ?? "Something went wrong while calling the API.",
      response.status
    )
  }

  return data as T
}
