import { prisma } from "../../lib/prisma"
import { hashPassword, verifyPassword } from "../../lib/password"
import { signAppToken } from "../../lib/local-auth"

type AuthInput = {
  email: string
  password: string
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function registerUser(input: AuthInput) {
  const email = normalizeEmail(input.email)
  const existingUser = await prisma.user.findUnique({ where: { email } })

  if (existingUser) {
    throw new Error("Email already in use")
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(input.password),
    },
    include: { githubAccount: true },
  })

  return {
    token: signAppToken({ id: user.id, email: user.email }),
    user: {
      id: user.id,
      email: user.email,
      githubLogin: user.githubAccount?.githubLogin ?? null,
      githubAvatarUrl: user.githubAccount?.githubAvatarUrl ?? null,
    },
  }
}

export async function loginUser(input: AuthInput) {
  const email = normalizeEmail(input.email)
  const user = await prisma.user.findUnique({
    where: { email },
    include: { githubAccount: true },
  })

  if (!user || !user.passwordHash) {
    throw new Error("Invalid credentials")
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash)

  if (!passwordMatches) {
    throw new Error("Invalid credentials")
  }

  return {
    token: signAppToken({
      id: user.id,
      email: user.email,
      githubLogin: user.githubAccount?.githubLogin ?? null,
      githubAvatarUrl: user.githubAccount?.githubAvatarUrl ?? null,
    }),
    user: {
      id: user.id,
      email: user.email,
      githubLogin: user.githubAccount?.githubLogin ?? null,
      githubAvatarUrl: user.githubAccount?.githubAvatarUrl ?? null,
    },
  }
}
