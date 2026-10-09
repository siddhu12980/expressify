import { GitHubAuthCallbackClient } from "@/components/site/github-auth-callback-client"

export const dynamic = "force-dynamic"

export default async function GitHubAuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string
    id?: string
    email?: string
    githubLogin?: string
    githubAvatarUrl?: string
  }>
}) {
  const params = await searchParams

  return (
    <GitHubAuthCallbackClient
      token={params.token ?? null}
      id={params.id ?? null}
      email={params.email ?? null}
      githubLogin={params.githubLogin ?? null}
      githubAvatarUrl={params.githubAvatarUrl ?? null}
    />
  )
}
