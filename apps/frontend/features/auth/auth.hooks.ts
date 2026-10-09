"use client"

import { useMutation } from "@tanstack/react-query"

import { login, signup } from "./auth.api"
import type { AuthPayload } from "./auth.types"
import { useAuthStore } from "@/stores/auth-store"

function useAuthMutation(
  action: (payload: AuthPayload) => Promise<{
    token: string
    user: { id: string; email: string }
  }>
) {
  const setSession = useAuthStore((state) => state.setSession)

  return useMutation({
    mutationFn: action,
    onSuccess: (result) => {
      setSession(result)
    },
  })
}

export function useLoginMutation() {
  return useAuthMutation(login)
}

export function useSignupMutation() {
  return useAuthMutation(signup)
}
