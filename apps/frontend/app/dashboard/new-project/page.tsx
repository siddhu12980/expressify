import { NewProjectPageClient } from "@/components/site/new-project-page-client"

export const dynamic = "force-dynamic"

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{
    github?: string
    installation_id?: string
    setup_action?: string
  }>
}) {
  const params = await searchParams

  return (
    <NewProjectPageClient
      githubStatus={params.github ?? null}
      githubInstallationId={params.installation_id ?? null}
      githubSetupAction={params.setup_action ?? null}
    />
  )
}
