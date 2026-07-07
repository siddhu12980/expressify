import { prisma } from "../../lib/prisma"
import { sign } from "jsonwebtoken"
import { hashPassword, verifyPassword } from "../../lib/password"

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
  })

  return {
    token: sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET!),
    user: { id: user.id, email: user.email },
  }
}

export async function loginUser(input: AuthInput) {
  const email = normalizeEmail(input.email)
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    throw new Error("Invalid credentials")
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash)

  if (!passwordMatches) {
    throw new Error("Invalid credentials")
  }

  return {
    token: sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET!),
    user: { id: user.id, email: user.email },
  }
}
