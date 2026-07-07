import { Router } from "express"

import {
  authMiddleware,
  type AuthenticatedRequest,
} from "../../middleware/auth"
import {
  buildFrontendGithubAuthRedirect,
  buildFrontendGithubInstallRedirect,
  buildGithubInstallReturnPath,
  completeGithubOauth,
  getGithubInstallStartUrl,
  getGithubOauthStartUrl,
  handleGithubWebhook,
  listGithubInstallationsForUser,
  listGithubRepositoriesForUser,
  syncGithubInstallationForUser,
  verifyGithubWebhookSignature,
} from "./github.service"
import { signAppToken } from "../../lib/local-auth"

export const githubRouter = Router()

githubRouter.get("/installations", authMiddleware, async (req, res) => {
  const authReq = req as AuthenticatedRequest
  const installations = await listGithubInstallationsForUser(authReq.auth!.userId)

  res.json({ installations })
})

githubRouter.get("/repositories", authMiddleware, async (req, res) => {
  const authReq = req as AuthenticatedRequest
  const installationId =
    typeof req.query.installationId === "string"
      ? req.query.installationId
      : undefined

  try {
    const repositories = await listGithubRepositoriesForUser(
      authReq.auth!.userId,
      installationId
    )

    return res.json({ repositories })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to fetch GitHub repositories."

    return res.status(400).json({ error: message })
  }
})

githubRouter.post("/install/start", authMiddleware, async (req, res) => {
  const authReq = req as AuthenticatedRequest
  const returnTo =
    typeof req.body?.returnTo === "string" ? req.body.returnTo : "/dashboard/new-project"
  const url = getGithubInstallStartUrl(authReq.auth!.userId, returnTo)

  res.json({ url })
})

githubRouter.post("/installations/sync", authMiddleware, async (req, res) => {
  const authReq = req as AuthenticatedRequest
  const installationId =
    typeof req.body?.installationId === "string" ? req.body.installationId : null

  if (!installationId) {
    return res.status(400).json({ error: "installationId is required." })
  }

  try {
    const installation = await syncGithubInstallationForUser(
      authReq.auth!.userId,
      installationId
    )

    return res.json({ installation })
  } catch (error) {
    return res.status(400).json({
      error:
        error instanceof Error
          ? error.message
          : "Unable to sync GitHub installation.",
    })
  }
})

githubRouter.get("/install/callback", async (req, res) => {
  const state = typeof req.query.state === "string" ? req.query.state : null
  const installationId =
    typeof req.query.installation_id === "string"
      ? req.query.installation_id
      : null

  if (!installationId) {
    return res.redirect(
      buildFrontendGithubInstallRedirect("/dashboard/new-project?github=error")
    )
  }

  const returnPath = buildGithubInstallReturnPath({
    state,
    installationId,
    setupAction:
      typeof req.query.setup_action === "string"
        ? req.query.setup_action
        : undefined,
  })

  return res.redirect(buildFrontendGithubInstallRedirect(returnPath))
})

export const githubWebhookRouter = Router()

githubWebhookRouter.post("/", async (req, res) => {
  const rawBody = req.body as Buffer
  const signature = req.header("x-hub-signature-256")

  if (!verifyGithubWebhookSignature(rawBody, signature)) {
    return res.status(401).json({ error: "Invalid webhook signature" })
  }

  const payload = JSON.parse(rawBody.toString("utf8")) as Record<string, unknown>
  const event = req.header("x-github-event")

  if (!event) {
    return res.status(400).json({ error: "Missing GitHub event header" })
  }

  await handleGithubWebhook({ event, payload })
  res.json({ ok: true })
})

export const githubAuthRouter = Router()

githubAuthRouter.get("/start", (req, res) => {
  const url = getGithubOauthStartUrl()

  console.log("[github-oauth/start] request received", {
    method: req.method,
    path: req.path,
    origin: req.header("origin"),
    referer: req.header("referer"),
    redirectTo: url,
  })

  res.redirect(url)
})

githubAuthRouter.get("/callback", async (req, res) => {
  const code = typeof req.query.code === "string" ? req.query.code : null
  const state = typeof req.query.state === "string" ? req.query.state : null
  const error = typeof req.query.error === "string" ? req.query.error : null
  const errorDescription =
    typeof req.query.error_description === "string"
      ? req.query.error_description
      : null

  console.log("[github-oauth/callback] request received", {
    hasCode: Boolean(code),
    hasState: Boolean(state),
    error,
    errorDescription,
    queryKeys: Object.keys(req.query),
  })

  if (error) {
    console.error("[github-oauth/callback] GitHub returned error", {
      error,
      errorDescription,
    })

    return res.redirect(
      buildFrontendGithubInstallRedirect("/login?github=error")
    )
  }

  if (!code || !state) {
    console.error("[github-oauth/callback] missing code or state", {
      codePresent: Boolean(code),
      statePresent: Boolean(state),
    })

    return res.redirect(
      buildFrontendGithubInstallRedirect("/login?github=error")
    )
  }

  try {
    const result = await completeGithubOauth(code, state)
    const token = signAppToken(result.user)

    console.log("[github-oauth/callback] oauth completed", {
      userId: result.user.id,
      email: result.user.email,
      githubLogin: result.user.githubLogin,
      returnTo: result.returnTo,
    })

    return res.redirect(
      buildFrontendGithubAuthRedirect({
        token,
        user: result.user,
      })
    )
  } catch (callbackError) {
    console.error("[github-oauth/callback] failed to complete oauth", {
      message:
        callbackError instanceof Error
          ? callbackError.message
          : "Unknown error",
      stack: callbackError instanceof Error ? callbackError.stack : undefined,
    })

    return res.redirect(
      buildFrontendGithubInstallRedirect("/login?github=error")
    )
  }
})
