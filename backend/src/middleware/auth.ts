import type { NextFunction, Request, Response } from "express"

import jwt from "jsonwebtoken"

type AuthenticatedRequest = Request & {
  auth?: {
    userId: string
    email: string
  }
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.header("authorization")

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const token = authHeader.slice("Bearer ".length)
  const payload = jwt.verify(token, process.env.JWT_SECRET!)
  req.auth = payload as { userId: string; email: string }
  next()
}

export type { AuthenticatedRequest }
