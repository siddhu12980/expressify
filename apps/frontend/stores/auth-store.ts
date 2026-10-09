"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export type AuthUser = {
  id: string
  email: string
  githubLogin?: string | null
  githubAvatarUrl?: string | null
}

type AuthSession = {
  token: string
  user: AuthUser
}

type AuthStore = {
  token: string | null
  user: AuthUser | null
  hydrated: boolean
  isAuthenticated: boolean
  setSession: (session: AuthSession) => void
  clearSession: () => void
  setHydrated: (value: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hydrated: false,
      isAuthenticated: false,
      setSession: (session) =>
        set({
          token: session.token,
          user: session.user,
          isAuthenticated: true,
        }),
      clearSession: () =>
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        }),
      setHydrated: (value) => set({ hydrated: value }),
    }),
    {
      name: "mini-vercel-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)
