import jwt from "jsonwebtoken"

type SessionUser = {
  id: string
  email: string
  githubLogin?: string | null
  githubAvatarUrl?: string | null
}

export function signAppToken(user: SessionUser) {
  return jwt.sign(
    {
      sub: user.id,
      userId: user.id,
      email: user.email,
      githubLogin: user.githubLogin ?? null,
      githubAvatarUrl: user.githubAvatarUrl ?? null,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  )
}
