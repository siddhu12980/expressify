import type { AuthUser } from "@/stores/auth-store"

export type AuthPayload = {
  email: string
  password: string
}

export type AuthResponse = {
  token: string
  user: AuthUser
}
