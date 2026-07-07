import jwt from "jsonwebtoken"

import { prisma } from "../../lib/prisma"
import { decryptString, encryptString } from "../../lib/encryption"

type SignedStatePayload = {
  purpose: "github-oauth" | "github-install"
  returnTo: string
  userId?: string
}

type GitHubUserProfile = {
  id: number
  login: string
  avatar_url: string | null
  email: string | null
}

type GitHubEmail = {
  email: string
  primary: boolean
  verified: boolean
}

type InstallationRepository = {
  id: number
  name: string
  full_name: string
  html_url: string
  default_branch: string
  owner: {
    login: string
  }
}

function getFrontendUrl() {
  return (process.env.FRONTEND_URL ?? "http://localhost:3000").replace(/\/$/, "")
}

function getBackendUrl() {
  return (process.env.BACKEND_URL ?? "http://localhost:8080").replace(/\/$/, "")
}

function signState(payload: SignedStatePayload) {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "10m" })
}

function verifyState(state: string) {
  return jwt.verify(state, process.env.JWT_SECRET!) as SignedStatePayload
}

export function getGithubOauthStartUrl() {
  const backendUrl = getBackendUrl()
  const redirectUri = `${backendUrl}/api/auth/github/callback`
  const clientId = process.env.GITHUB_CLIENT_ID
  const state = signState({
    purpose: "github-oauth",
    returnTo: "/auth/github/callback",
  })
  const params = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri,
    scope: "read:user user:email",
    state,
  })

  const url = `https://github.com/login/oauth/authorize?${params.toString()}`

  console.log("[github-oauth/start] built authorize redirect", {
    backendUrl,
    redirectUri,
    clientIdPresent: Boolean(clientId),
    clientIdPrefix: clientId?.slice(0, 8),
    scope: "read:user user:email",
    stateLength: state.length,
    url,
  })

  return url
}

export async function completeGithubOauth(code: string, state: string) {
  const parsedState = verifyState(state)

  if (parsedState.purpose !== "github-oauth") {
    throw new Error("Invalid GitHub OAuth state")
  }

  const tokenResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${getBackendUrl()}/api/auth/github/callback`,
        state,
      }),
    }
  )

  const tokenData = (await tokenResponse.json()) as {
    access_token?: string
    error?: string
    error_description?: string
  }

  console.log("[github-oauth/callback] token exchange response", {
    ok: tokenResponse.ok,
    status: tokenResponse.status,
    hasAccessToken: Boolean(tokenData.access_token),
    error: tokenData.error ?? null,
    errorDescription: tokenData.error_description ?? null,
  })

  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description ?? "Unable to exchange GitHub OAuth code")
  }

  const accessToken = tokenData.access_token
  const [profileResponse, emailResponse] = await Promise.all([
    fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
      },
    }),
    fetch("https://api.github.com/user/emails", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
      },
    }),
  ])

  if (!profileResponse.ok) {
    throw new Error("Unable to fetch GitHub profile")
  }

  const profile = (await profileResponse.json()) as GitHubUserProfile
  const emails = emailResponse.ok
    ? ((await emailResponse.json()) as GitHubEmail[])
    : []

  const verifiedPrimaryEmail =
    emails.find((email) => email.primary && email.verified)?.email ??
    emails.find((email) => email.verified)?.email ??
    profile.email ??
    `${profile.id}+${profile.login}@users.noreply.github.com`

  const existingGithubAccount = await prisma.gitHubAccount.findUnique({
    where: { githubUserId: String(profile.id) },
    include: { user: true },
  })

  if (existingGithubAccount) {
    const account = await prisma.gitHubAccount.update({
      where: { id: existingGithubAccount.id },
      data: {
        githubLogin: profile.login,
        githubAvatarUrl: profile.avatar_url,
        githubEmail: verifiedPrimaryEmail,
        encryptedAccessToken: encryptString(accessToken),
      },
      include: { user: true },
    })

    return {
      returnTo: parsedState.returnTo,
      user: {
        id: account.user.id,
        email: account.user.email,
        githubLogin: account.githubLogin,
        githubAvatarUrl: account.githubAvatarUrl,
      },
    }
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: verifiedPrimaryEmail },
  })

  const user = existingUser
    ? existingUser
    : await prisma.user.create({
        data: {
          email: verifiedPrimaryEmail,
          passwordHash: null,
        },
      })

  const account = await prisma.gitHubAccount.upsert({
    where: { userId: user.id },
    update: {
      githubUserId: String(profile.id),
      githubLogin: profile.login,
      githubAvatarUrl: profile.avatar_url,
      githubEmail: verifiedPrimaryEmail,
      encryptedAccessToken: encryptString(accessToken),
    },
    create: {
      userId: user.id,
      githubUserId: String(profile.id),
      githubLogin: profile.login,
      githubAvatarUrl: profile.avatar_url,
      githubEmail: verifiedPrimaryEmail,
      encryptedAccessToken: encryptString(accessToken),
    },
  })

  return {
    returnTo: parsedState.returnTo,
    user: {
      id: user.id,
      email: user.email,
      githubLogin: account.githubLogin,
      githubAvatarUrl: account.githubAvatarUrl,
    },
  }
}

export function getGithubInstallStartUrl(userId: string, returnTo: string) {
  const state = signState({
    purpose: "github-install",
    returnTo,
    userId,
  })

  return `https://github.com/apps/${process.env.GITHUB_APP_SLUG}/installations/new?state=${encodeURIComponent(state)}`
}

async function fetchGithubInstallationDetails(installationId: string) {
  const installationResponse = await fetch(
    `https://api.github.com/app/installations/${installationId}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${createGithubAppJwt()}`,
      },
    }
  )

  if (!installationResponse.ok) {
    throw new Error("Unable to fetch installation details")
  }

  return (await installationResponse.json()) as {
    id: number
    account: { login: string; type: string }
    target_type: string
    repository_selection: string
    permissions: Record<string, string>
  }
}

async function saveGithubInstallationRecord(input: {
  userId: string
  installationId: string
}) {
  const installation = await fetchGithubInstallationDetails(input.installationId)

  return prisma.gitHubInstallation.upsert({
    where: { githubInstallationId: String(installation.id) },
    update: {
      userId: input.userId,
      githubAccountLogin: installation.account.login,
      githubAccountType: installation.account.type,
      targetType: installation.target_type,
      repositoriesMode: installation.repository_selection,
      permissionsJson: JSON.stringify(installation.permissions),
      status: "ACTIVE",
      suspendedAt: null,
      deletedAt: null,
    },
    create: {
      userId: input.userId,
      githubInstallationId: String(installation.id),
      githubAccountLogin: installation.account.login,
      githubAccountType: installation.account.type,
      targetType: installation.target_type,
      repositoriesMode: installation.repository_selection,
      permissionsJson: JSON.stringify(installation.permissions),
      status: "ACTIVE",
    },
  })
}

function resolveGithubInstallReturnTo(state?: string | null) {
  if (!state) {
    return "/dashboard/new-project"
  }

  try {
    const parsedState = verifyState(state)

    if (parsedState.purpose === "github-install") {
      return parsedState.returnTo
    }
  } catch {}

  return "/dashboard/new-project"
}

export function buildGithubInstallReturnPath(input: {
  state?: string | null
  installationId: string
  setupAction?: string
}) {
  const returnTo = resolveGithubInstallReturnTo(input.state)
  const [pathname, rawQuery = ""] = returnTo.split("?", 2)
  const params = new URLSearchParams(rawQuery)

  params.set(
    "github",
    input.setupAction === "update" ? "updated" : "connected"
  )
  params.set("installation_id", input.installationId)

  if (input.setupAction) {
    params.set("setup_action", input.setupAction)
  }

  return `${pathname}?${params.toString()}`
}

export async function listGithubInstallationsForUser(userId: string) {
  return prisma.gitHubInstallation.findMany({
    where: {
      userId,
      status: "ACTIVE",
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function listGithubRepositoriesForUser(
  userId: string,
  installationId?: string
) {
  const installation = installationId
    ? await prisma.gitHubInstallation.findFirst({
        where: {
          id: installationId,
          userId,
          status: "ACTIVE",
          deletedAt: null,
        },
      })
    : await prisma.gitHubInstallation.findFirst({
        where: {
          userId,
          status: "ACTIVE",
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
      })

  if (!installation) {
    throw new Error("No active GitHub installation found.")
  }

  const accessToken = await createInstallationAccessToken(
    installation.githubInstallationId
  )

  const response = await fetch(
    "https://api.github.com/installation/repositories",
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken.token}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error("Unable to fetch repositories from GitHub installation.")
  }

  const data = (await response.json()) as {
    repositories?: InstallationRepository[]
  }

  return (data.repositories ?? []).map((repository) => ({
    id: String(repository.id),
    name: repository.name,
    fullName: repository.full_name,
    repoUrl: repository.html_url,
    defaultBranch: repository.default_branch,
    ownerLogin: repository.owner.login,
  }))
}

export async function getActiveInstallationForUser(userId: string) {
  return prisma.gitHubInstallation.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function syncGithubInstallationForUser(
  userId: string,
  githubInstallationId: string
) {
  const githubAccount = await prisma.gitHubAccount.findUnique({
    where: { userId },
  })

  if (!githubAccount?.encryptedAccessToken) {
    throw new Error("Connect GitHub sign-in before syncing repository access.")
  }

  const userAccessToken = decryptString(githubAccount.encryptedAccessToken)
  const installationsResponse = await fetch(
    "https://api.github.com/user/installations?per_page=100",
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${userAccessToken}`,
      },
    }
  )

  if (!installationsResponse.ok) {
    throw new Error("Unable to verify the GitHub installation for this user.")
  }

  const installationsData = (await installationsResponse.json()) as {
    installations?: Array<{ id: number }>
  }

  const hasAccess = (installationsData.installations ?? []).some(
    (installation) => String(installation.id) === githubInstallationId
  )

  if (!hasAccess) {
    throw new Error("The selected GitHub installation is not available to this user.")
  }

  const installation = await saveGithubInstallationRecord({
    userId,
    installationId: githubInstallationId,
  })

  return installation
}

export async function handleGithubWebhook(input: {
  event: string
  payload: Record<string, unknown>
}) {
  if (input.event === "installation") {
    const installation = input.payload.installation as
      | { id: number; account?: { login?: string; type?: string }; target_type?: string; repository_selection?: string; permissions?: Record<string, string> }
      | undefined
    const action = input.payload.action as string | undefined

    if (!installation) {
      return
    }

    if (action === "deleted") {
      await prisma.gitHubInstallation.updateMany({
        where: { githubInstallationId: String(installation.id) },
        data: {
          status: "REMOVED",
          deletedAt: new Date(),
        },
      })
      return
    }

    if (action === "suspend") {
      await prisma.gitHubInstallation.updateMany({
        where: { githubInstallationId: String(installation.id) },
        data: {
          status: "SUSPENDED",
          suspendedAt: new Date(),
        },
      })
      return
    }

    if (action === "unsuspend" || action === "created" || action === "new_permissions_accepted") {
      await prisma.gitHubInstallation.updateMany({
        where: { githubInstallationId: String(installation.id) },
        data: {
          githubAccountLogin: installation.account?.login ?? "",
          githubAccountType: installation.account?.type ?? "",
          targetType: installation.target_type ?? "",
          repositoriesMode: installation.repository_selection ?? null,
          permissionsJson: installation.permissions
            ? JSON.stringify(installation.permissions)
            : null,
          status: "ACTIVE",
          suspendedAt: null,
          deletedAt: null,
        },
      })
    }

    return
  }

  if (input.event === "installation_repositories") {
    const installation = input.payload.installation as
      | { id: number; repository_selection?: string }
      | undefined

    if (!installation) {
      return
    }

    await prisma.gitHubInstallation.updateMany({
      where: { githubInstallationId: String(installation.id) },
      data: {
        repositoriesMode: installation.repository_selection ?? null,
      },
    })
  }
}

export function verifyGithubWebhookSignature(rawBody: Buffer, signature?: string) {
  if (!signature) {
    return false
  }

  const { createHmac, timingSafeEqual } = require("node:crypto") as typeof import("node:crypto")
  const digest = `sha256=${createHmac("sha256", process.env.GITHUB_APP_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex")}`

  const signatureBuffer = Buffer.from(signature)
  const digestBuffer = Buffer.from(digest)

  return (
    signatureBuffer.length === digestBuffer.length &&
    timingSafeEqual(signatureBuffer, digestBuffer)
  )
}

export function buildFrontendGithubAuthRedirect(input: {
  token: string
  user: {
    id: string
    email: string
    githubLogin?: string | null
    githubAvatarUrl?: string | null
  }
}) {
  const params = new URLSearchParams({
    token: input.token,
    id: input.user.id,
    email: input.user.email,
  })

  if (input.user.githubLogin) {
    params.set("githubLogin", input.user.githubLogin)
  }

  if (input.user.githubAvatarUrl) {
    params.set("githubAvatarUrl", input.user.githubAvatarUrl)
  }

  const redirectUrl = `${getFrontendUrl()}/auth/github/callback?${params.toString()}`

  console.log("[github-oauth/callback] redirecting to frontend", {
    frontendUrl: getFrontendUrl(),
    userId: input.user.id,
    email: input.user.email,
    githubLogin: input.user.githubLogin ?? null,
    tokenLength: input.token.length,
    redirectUrl,
  })

  return redirectUrl
}

export function buildFrontendGithubInstallRedirect(path: string) {
  return `${getFrontendUrl()}${path}`
}

export function createGithubAppJwt() {
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n")

  if (!privateKey) {
    throw new Error("GITHUB_APP_PRIVATE_KEY is not set")
  }

  return jwt.sign(
    {
      iat: Math.floor(Date.now() / 1000) - 60,
      exp: Math.floor(Date.now() / 1000) + 9 * 60,
      iss: process.env.GITHUB_APP_ID,
    },
    privateKey,
    { algorithm: "RS256" }
  )
}

export async function createInstallationAccessToken(githubInstallationId: string) {
  const response = await fetch(
    `https://api.github.com/app/installations/${githubInstallationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${createGithubAppJwt()}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error("Unable to create GitHub installation access token")
  }

  return (await response.json()) as {
    token: string
    expires_at: string
  }
}
