"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"

import {
  DashboardEmptyState,
  DashboardPrimaryLink,
  DashboardShell,
} from "@/components/site/dashboard-shell"
import { ProjectCreateForm } from "@/components/site/project-create-form"
import {
  githubKeys,
  useGitHubInstallStartMutation,
  useGitHubInstallationsQuery,
  useGitHubRepositoriesQuery,
  useSyncGitHubInstallationMutation,
} from "@/features/github/github.hooks"
import { getGitHubInstallationConfigureUrl } from "@/features/github/github.types"
import { useAuthHydrated } from "@/hooks/use-auth-hydrated"
import { ApiError } from "@/lib/api"
import { useAuthStore } from "@/stores/auth-store"

export function NewProjectPageClient({
  githubStatus,
  githubInstallationId,
  githubSetupAction,
}: {
  githubStatus: string | null
  githubInstallationId: string | null
  githubSetupAction: string | null
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const hydrated = useAuthHydrated()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const installationsQuery = useGitHubInstallationsQuery()
  const installStartMutation = useGitHubInstallStartMutation()
  const syncInstallationMutation = useSyncGitHubInstallationMutation()
  const [installError, setInstallError] = React.useState<string | null>(null)
  const [syncNotice, setSyncNotice] = React.useState<string | null>(null)
  const [selectedInstallationId, setSelectedInstallationId] = React.useState<
    string | null
  >(null)
  const handledGithubReturnRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/login")
    }
  }, [hydrated, isAuthenticated, router])

  React.useEffect(() => {
    if (
      !hydrated ||
      !isAuthenticated ||
      !githubStatus ||
      !githubInstallationId
    ) {
      return
    }

    const returnKey = `${githubStatus}:${githubInstallationId}:${githubSetupAction ?? ""}`

    if (handledGithubReturnRef.current === returnKey) {
      return
    }

    handledGithubReturnRef.current = returnKey
    const installationIdToSync = githubInstallationId

    async function syncInstallation() {
      try {
        const result = await syncInstallationMutation.mutateAsync(
          installationIdToSync
        )

        setSelectedInstallationId(result.installation.id)
        setInstallError(null)
        setSyncNotice(
          githubStatus === "updated"
            ? "Repository access updated. Refreshing the repository list."
            : "GitHub installation connected. Refreshing the repository list."
        )

        await queryClient.invalidateQueries({
          queryKey: githubKeys.all,
        })
      } catch (error) {
        setInstallError(
          error instanceof ApiError
            ? error.message
            : "Unable to refresh GitHub repository access."
        )
      } finally {
        router.replace("/dashboard/new-project")
      }
    }

    void syncInstallation()
  }, [
    githubInstallationId,
    githubSetupAction,
    githubStatus,
    hydrated,
    isAuthenticated,
    queryClient,
    router,
    syncInstallationMutation,
  ])

  const installations = installationsQuery.data?.installations ?? []
  const effectiveInstallationId = selectedInstallationId ?? installations[0]?.id
  const installation =
    installations.find((item) => item.id === effectiveInstallationId) ??
    installations[0]
  const repositoriesQuery = useGitHubRepositoriesQuery(installation?.id)

  async function startInstall() {
    setInstallError(null)

    try {
      const result = await installStartMutation.mutateAsync(
        "/dashboard/new-project"
      )
      window.location.assign(result.url)
    } catch (error) {
      setInstallError(
        error instanceof ApiError
          ? error.message
          : "Unable to start GitHub installation."
      )
    }
  }

  if (!hydrated || !isAuthenticated) {
    return null
  }
  const githubError =
    installError ??
    (githubStatus === "error"
      ? "GitHub connection failed. Try the installation step again."
      : null)
  const isRefreshingGithubAccess = syncInstallationMutation.isPending

  return (
    <DashboardShell
      title="Create project"
      subtitle="Pick a repository your GitHub App installation can already access. If the repo is missing, send the user through GitHub’s repository access screen and return here automatically."
      actions={
        <DashboardPrimaryLink href="/dashboard">
          Back to projects
        </DashboardPrimaryLink>
      }
    >
      {installationsQuery.isLoading ? (
        <div className="h-64 animate-pulse border border-[#2a2d37] bg-[#11141c]" />
      ) : !installation ? (
        <DashboardEmptyState
          title="Connect GitHub to import repositories"
          copy="Install your GitHub App on the account or repositories you want this platform to access. After that, you can create a project and later import repo details safely through the installation."
          action={
            <button
              type="button"
              onClick={startInstall}
              className="inline-flex h-10 items-center justify-center border border-[#4d8eff] bg-[#4d8eff] px-4 text-sm font-medium text-[#05152f] transition-colors hover:border-[#79a8ff] hover:bg-[#79a8ff]"
            >
              {installStartMutation.isPending
                ? "Redirecting..."
                : "Install GitHub App"}
            </button>
          }
        />
      ) : repositoriesQuery.isLoading || isRefreshingGithubAccess ? (
        <div className="h-64 animate-pulse border border-[#2a2d37] bg-[#11141c]" />
      ) : (
        <div className="border border-[#2a2d37] bg-[#11141c] p-5">
          {syncNotice ? (
            <div className="mb-4 rounded-[4px] border border-[#264b35] bg-[#14231a] px-3 py-2 text-sm text-[#b7f7cb]">
              {syncNotice}
            </div>
          ) : null}
          {githubError ? (
            <div className="mb-4 rounded-[4px] border border-[#53313a] bg-[#26171c] px-3 py-2 text-sm text-[#ffb4ab]">
              {githubError}
            </div>
          ) : null}
          {installations.length > 1 ? (
            <label className="mb-4 block">
              <span className="mb-2 block font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
                GitHub installation
              </span>
              <select
                value={effectiveInstallationId ?? ""}
                onChange={(event) => setSelectedInstallationId(event.target.value)}
                className="h-11 w-full border border-[#2a2d37] bg-[#0f131a] px-3 text-sm text-[#edf0f7] outline-none transition-colors focus:border-[#4d8eff]"
              >
                {installations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.githubAccountLogin} ({item.repositoriesMode ?? "selected"})
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {installation ? (
            <div className="mb-4 flex flex-col gap-3 border border-[#2a2d37] bg-[#141821] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-[#cfd5e4]">
                <div className="font-medium text-[#eef1f8]">
                  Repository access for {installation.githubAccountLogin}
                </div>
                <div className="mt-1 text-[#aab0c2]">
                  {installation.repositoriesMode === "all"
                    ? "This installation can access all repositories in that account."
                    : "Only selected repositories are visible here. If the one you need is missing, send the user to GitHub’s repository access screen and return here."}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={getGitHubInstallationConfigureUrl(installation)}
                  className="inline-flex h-10 items-center justify-center border border-[#4d8eff] bg-[#4d8eff] px-4 text-sm font-medium text-[#05152f] transition-colors hover:border-[#79a8ff] hover:bg-[#79a8ff]"
                >
                  Add repository access
                </a>
                <button
                  type="button"
                  onClick={() =>
                    void repositoriesQuery.refetch({ cancelRefetch: false })
                  }
                  className="inline-flex h-10 items-center justify-center border border-[#2a2d37] bg-[#151821] px-4 text-sm text-[#eef1f8] transition-colors hover:border-[#424754] hover:bg-[#1b1f28]"
                >
                  Refresh repositories
                </button>
              </div>
            </div>
          ) : null}
          {installation && (repositoriesQuery.data?.repositories?.length ?? 0) === 0 ? (
            <div className="mb-4 border border-dashed border-[#2a2d37] bg-[#10141b] px-4 py-4 text-sm text-[#aab0c2]">
              No repositories are currently available for this installation. Use
              {" "}
              <span className="text-[#eef1f8]">Add repository access</span>
              {" "}
              to grant this app access on GitHub, then come back here.
            </div>
          ) : null}
          <ProjectCreateForm
            installation={installation}
            repositories={repositoriesQuery.data?.repositories ?? []}
          />
        </div>
      )}
    </DashboardShell>
  )
}
