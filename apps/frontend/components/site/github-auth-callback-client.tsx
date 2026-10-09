"use client"

import { useRouter } from "next/navigation"
import * as React from "react"

import { useAuthStore } from "@/stores/auth-store"

export function GitHubAuthCallbackClient({
  token,
  id,
  email,
  githubLogin,
  githubAvatarUrl,
}: {
  token: string | null
  id: string | null
  email: string | null
  githubLogin?: string | null
  githubAvatarUrl?: string | null
}) {
  const router = useRouter()
  const setSession = useAuthStore((state) => state.setSession)

  React.useEffect(() => {
    if (!token || !id || !email) {
      router.replace("/login?github=error")
      return
    }

    setSession({
      token,
      user: {
        id,
        email,
        githubLogin,
        githubAvatarUrl,
      },
    })

    router.replace("/dashboard")
  }, [email, githubAvatarUrl, githubLogin, id, router, setSession, token])

  return null
}
