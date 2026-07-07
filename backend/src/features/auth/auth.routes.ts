import { Router } from "express"

import { loginUser, registerUser } from "./auth.service"
import { githubAuthRouter } from "../github/github.routes"

export const authRouter = Router()

authRouter.use("/github", githubAuthRouter)

function parseAuthBody(body: unknown) {
  const input = body as { email?: unknown; password?: unknown }

  if (
    typeof input?.email !== "string" ||
    typeof input?.password !== "string" ||
    input.password.length < 6
  ) {
    return null
  }

  return {
    email: input.email,
    password: input.password,
  }
}

authRouter.post("/signup", async (req, res) => {
  const input = parseAuthBody(req.body)

  if (!input) {
    return res
      .status(400)
      .json({ error: "Email and password are required. Password must be at least 6 characters." })
  }

  try {
    const result = await registerUser(input)
    return res.status(201).json(result)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create account"

    return res.status(400).json({ error: message })
  }
})

authRouter.post("/login", async (req, res) => {
  const input = parseAuthBody(req.body)

  if (!input) {
    return res.status(400).json({ error: "Email and password are required." })
  }

  try {
    const result = await loginUser(input)
    return res.json(result)
  } catch {
    return res.status(401).json({ error: "Invalid credentials" })
  }
})
