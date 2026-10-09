"use client"

import { useEffect } from "react"

import { useAuthStore } from "@/stores/auth-store"

export function useAuthHydrated() {
  const hydrated = useAuthStore((state) => state.hydrated)
  const setHydrated = useAuthStore((state) => state.setHydrated)

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true)
    }
  }, [setHydrated])

  return hydrated
}
