import { apiFetch } from "@/lib/api"

import type { AuthPayload, AuthResponse } from "./auth.types"

export function login(payload: AuthPayload) {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function signup(payload: AuthPayload) {
  return apiFetch<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
