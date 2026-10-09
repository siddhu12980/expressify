"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { ArrowRight, GitBranch, Plus } from "lucide-react"

import {
  DashboardEmptyState,
  DashboardPrimaryLink,
  DashboardShell,
} from "@/components/site/dashboard-shell"
import { useProjectsQuery } from "@/features/projects/projects.hooks"
import { useAuthHydrated } from "@/hooks/use-auth-hydrated"
import { useAuthStore } from "@/stores/auth-store"

export default function DashboardPage() {
  const router = useRouter()
  const hydrated = useAuthHydrated()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const { data, isLoading } = useProjectsQuery()

  React.useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/login")
    }
  }, [hydrated, isAuthenticated, router])

  if (!hydrated || !isAuthenticated) {
    return null
  }

  const projects = data?.projects ?? []

  return (
    <DashboardShell
      title="Projects"
      subtitle={`Track repositories, deployment state, and runtime readiness for ${user?.email ?? "your account"}.`}
      actions={
        <DashboardPrimaryLink href="/dashboard/new-project">
          New project
        </DashboardPrimaryLink>
      }
    >
      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse border border-[#2a2d37] bg-[#11141c]"
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <DashboardEmptyState
          title="No projects yet"
          copy="Create your first project to connect a repository, choose a branch, and start your first deployment flow."
          action={
            <DashboardPrimaryLink href="/dashboard/new-project">
              Create new project
            </DashboardPrimaryLink>
          }
        />
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => {
            const latestDeployment = project.deployments[0]

            return (
              <article
                key={project.id}
                className="grid gap-4 border border-[#2a2d37] bg-[#11141c] p-5 lg:grid-cols-[1fr_auto]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-medium text-[#f5f7fb]">
                      {project.name}
                    </h2>
                    <span className="font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
                      {project.slug}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[#aab0c2]">
                    <span className="inline-flex items-center gap-2">
                      <GitBranch className="size-4 text-[#adc6ff]" />
                      {project.repoOwner}/{project.repoName}
                    </span>
                    <span>Branch: {project.branch}</span>
                    <span>
                      Status:{" "}
                      {latestDeployment?.status?.toLowerCase() ??
                        "no deployments"}
                    </span>
                    {latestDeployment?.hostPort ? (
                      <span>Port: {latestDeployment.hostPort}</span>
                    ) : null}
                    {latestDeployment?.lastError ? (
                      <span className="text-[#ffb4ab]">
                        {latestDeployment.lastError}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-start lg:justify-end">
                  <Link
                    href={`/project/${project.id}`}
                    className="inline-flex h-10 items-center gap-2 border border-[#4d8eff] bg-[#4d8eff] px-4 text-sm font-medium text-[#05152f] transition-colors hover:border-[#79a8ff] hover:bg-[#79a8ff]"
                  >
                    View project
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </article>
            )
          })}

          <Link
            href="/dashboard/new-project"
            className="inline-flex h-10 w-fit items-center gap-2 border border-[#2a2d37] bg-[#151821] px-4 text-sm text-[#eef1f8] transition-colors hover:border-[#424754] hover:bg-[#1b1f28]"
          >
            <Plus className="size-4" />
            Create another project
          </Link>
        </div>
      )}
    </DashboardShell>
  )
}
