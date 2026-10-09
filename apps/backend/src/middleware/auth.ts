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
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId?: string
      sub?: string
      email?: string
    }

    if (!payload.email || (!payload.userId && !payload.sub)) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    req.auth = {
      userId: payload.userId ?? payload.sub!,
      email: payload.email,
    }

    next()
  } catch {
    return res.status(401).json({ error: "Unauthorized" })
  }
}

export type { AuthenticatedRequest }
