"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import {
  ArrowLeft,
  Check,
  ExternalLink,
  GitBranch,
  Pencil,
  Play,
  Trash2,
} from "lucide-react"

import { DashboardShell } from "@/components/site/dashboard-shell"
import {
  useDeleteDeploymentMutation,
  useDeleteProjectMutation,
  useDeployProjectMutation,
  useProjectQuery,
  useUpdateProjectEnvVarsMutation,
} from "@/features/projects/projects.hooks"
import type { Project } from "@/features/projects/projects.types"
import { useAuthHydrated } from "@/hooks/use-auth-hydrated"
import { ApiError } from "@/lib/api"
import { useAuthStore } from "@/stores/auth-store"

type EditableEnvVar = {
  id: string
  key: string
  value: string
  isEditing: boolean
}

type ProjectSection = "overview" | "logs" | "environment" | "settings"

const PROJECT_SECTIONS: Array<{
  key: ProjectSection
  label: string
  meta: string
}> = [
  { key: "overview", label: "Overview", meta: "Repository and deployments" },
  { key: "logs", label: "Logs", meta: "Runtime and build output" },
  { key: "environment", label: "Environment", meta: "Runtime variables" },
  { key: "settings", label: "Settings", meta: "Project controls" },
]

function trimEnvVar(envVar: EditableEnvVar): EditableEnvVar {
  return {
    ...envVar,
    key: envVar.key.trim(),
    value: envVar.value.trim(),
  }
}

function normalizeEnvVars(envVars: Array<EditableEnvVar>) {
  return envVars
    .map(trimEnvVar)
    .filter((envVar, index, current) => envVar.key.length > 0 || current.length === 1)
}

function parseEnvVarsFromPaste(rawText: string) {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))

  if (lines.length === 0) {
    return null
  }

  const parsed = lines
    .map((line) => {
      const normalizedLine = line.startsWith("export ")
        ? line.slice("export ".length).trim()
        : line
      const separatorIndex = normalizedLine.indexOf("=")

      if (separatorIndex < 0) {
        return null
      }

      return trimEnvVar(createEditableEnvVar({
        key: normalizedLine.slice(0, separatorIndex),
        value: normalizedLine.slice(separatorIndex + 1),
        isEditing: false,
      }))
    })
    .filter((envVar): envVar is EditableEnvVar => Boolean(envVar && envVar.key.length > 0))

  return parsed.length > 0 ? parsed : null
}

function createEditableEnvVar(input?: Partial<EditableEnvVar>): EditableEnvVar {
  return {
    id:
      input?.id ??
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    key: input?.key ?? "",
    value: input?.value ?? "",
    isEditing: input?.isEditing ?? true,
  }
}

export function ProjectDetailPage({ projectId }: { projectId: string }) {
  const router = useRouter()
  const hydrated = useAuthHydrated()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const deployMutation = useDeployProjectMutation()
  const deleteProjectMutation = useDeleteProjectMutation()
  const deleteDeploymentMutation = useDeleteDeploymentMutation()
  const { data, isLoading } = useProjectQuery(projectId)
  const [selectedDeploymentId, setSelectedDeploymentId] = React.useState<
    string | null
  >(null)
  const [selectedSection, setSelectedSection] =
    React.useState<ProjectSection>("overview")
  const [pageError, setPageError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/login")
    }
  }, [hydrated, isAuthenticated, router])

  React.useEffect(() => {
    const hash = window.location.hash.slice(1) as ProjectSection

    if (PROJECT_SECTIONS.some((section) => section.key === hash)) {
      setSelectedSection(hash)
    }
  }, [])

  const project = data?.project

  if (!hydrated || !isAuthenticated) {
    return null
  }

  if (isLoading) {
    return (
      <DashboardShell
        title="Project"
        subtitle="Loading project deployment state and logs."
        actions={
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center gap-2 border border-[#2a2d37] bg-[#151821] px-4 text-sm text-[#eef1f8]"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
        }
      >
        <div className="grid gap-4">
          <div className="h-32 animate-pulse border border-[#2a2d37] bg-[#11141c]" />
          <div className="h-80 animate-pulse border border-[#2a2d37] bg-[#11141c]" />
        </div>
      </DashboardShell>
    )
  }

  if (!project) {
    return (
      <DashboardShell
        title="Project"
        subtitle="This project is no longer available."
        actions={
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center gap-2 border border-[#2a2d37] bg-[#151821] px-4 text-sm text-[#eef1f8]"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
        }
      >
        <div className="border border-dashed border-[#2a2d37] bg-[#11141c] px-6 py-12 text-sm text-[#aab0c2]">
          Project not found.
        </div>
      </DashboardShell>
    )
  }

  const deployment =
    project.deployments.find((item) => item.id === selectedDeploymentId) ??
    project.deployments[0] ??
    null
  const deploymentUrl = deployment?.hostPort
    ? `http://localhost:${deployment.hostPort}`
    : null

  function handleSectionSelect(section: ProjectSection) {
    setSelectedSection(section)
    window.history.replaceState(null, "", `${window.location.pathname}#${section}`)
  }

  return (
    <DashboardShell
      title={project.name}
      subtitle={`Inspect deployment state, build logs, runtime logs, and controls for ${project.repoOwner}/${project.repoName}.`}
      railTitle="Project"
      railCurrent={{
        label: project.name,
        meta: `${project.repoOwner}/${project.repoName}`,
      }}
      railItems={PROJECT_SECTIONS.map((section) => ({
        key: section.key,
        label: section.label,
        meta: section.meta,
        active: selectedSection === section.key,
        onSelect: () => handleSectionSelect(section.key),
      }))}
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center gap-2 border border-[#2a2d37] bg-[#151821] px-4 text-sm text-[#eef1f8] transition-colors hover:border-[#424754] hover:bg-[#1b1f28]"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
          {deploymentUrl ? (
            <Link
              href={deploymentUrl}
              target="_blank"
              className="inline-flex h-10 items-center gap-2 border border-[#2a2d37] bg-[#151821] px-4 text-sm text-[#eef1f8] transition-colors hover:border-[#424754] hover:bg-[#1b1f28]"
            >
              Open app
              <ExternalLink className="size-4" />
            </Link>
          ) : null}
          <button
            type="button"
            onClick={async () => {
              setPageError(null)

              try {
                await deployMutation.mutateAsync(project.id)
              } catch (error) {
                setPageError(
                  error instanceof ApiError
                    ? error.message
                    : "Unable to start deployment."
                )
              }
            }}
            disabled={deployMutation.isPending}
            className="inline-flex h-10 items-center gap-2 border border-[#4d8eff] bg-[#4d8eff] px-4 text-sm font-medium text-[#05152f] transition-colors hover:border-[#79a8ff] hover:bg-[#79a8ff] disabled:opacity-60"
          >
            <Play className="size-4" />
            {deployMutation.isPending ? "Starting..." : "Deploy"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {pageError ? (
          <div className="rounded-[4px] border border-[#53313a] bg-[#26171c] px-3 py-2 text-sm text-[#ffb4ab]">
            {pageError}
          </div>
        ) : null}

        <section className="space-y-5 border border-[#2a2d37] bg-[#11141c] p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#2a2d37] pb-4">
            <div>
              <div className="font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
                Active deployment
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[#cfd5e4]">
                <span className="inline-flex items-center gap-2 text-[#eef1f8]">
                  <GitBranch className="size-4 text-[#adc6ff]" />
                  {project.repoOwner}/{project.repoName}
                </span>
                <span>Branch: {project.branch}</span>
                <span>
                  Deployment: {deployment?.id ?? "No deployment selected"}
                </span>
                <Link
                  href={project.repoUrl}
                  target="_blank"
                  className="inline-flex items-center gap-2 text-[#adc6ff] hover:text-[#c7d9ff]"
                >
                  Open repository
                  <ExternalLink className="size-4" />
                </Link>
              </div>
            </div>
            {deploymentUrl ? (
              <div className="font-mono text-[11px] tracking-[0.14em] text-[#8c909f] uppercase">
                Local URL {deploymentUrl}
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Project slug" value={project.slug} muted={false} />
            <MetricCard
              label="Latest status"
              value={deployment?.status.toLowerCase() ?? "no deployments"}
              muted={false}
            />
            <MetricCard
              label="Host port"
              value={deployment?.hostPort ? String(deployment.hostPort) : "not running"}
              muted={!deployment?.hostPort}
            />
            <MetricCard
              label="Section"
              value={PROJECT_SECTIONS.find((section) => section.key === selectedSection)?.label ?? "Overview"}
              muted={false}
            />
          </div>

          <div className="border border-[#2a2d37] bg-[#0f131a]">
            <div className="border-b border-[#2a2d37] px-4 py-3">
              <div className="font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
                Deployments
              </div>
            </div>
            <div className="space-y-2 px-3 py-3">
              {project.deployments.length === 0 ? (
                <div className="px-1 py-2 text-sm text-[#8c909f]">
                  No deployments yet.
                </div>
              ) : (
                project.deployments.map((item) => {
                  const active = item.id === deployment?.id

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedDeploymentId(item.id)}
                      className={`w-full border px-3 py-3 text-left transition-colors ${
                        active
                          ? "border-[#3c5d97] bg-[#141d2d] text-[#eef1f8]"
                          : "border-[#2a2d37] bg-[#0f131a] text-[#cfd5e4] hover:border-[#424754] hover:bg-[#151821]"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm font-medium">
                          {item.status.toLowerCase()}
                        </div>
                        {item.hostPort ? (
                          <div className="font-mono text-[11px] tracking-[0.14em] text-[#8c909f] uppercase">
                            localhost:{item.hostPort}
                          </div>
                        ) : null}
                      </div>
                      <div className="mt-1 font-mono text-[11px] tracking-[0.14em] text-[#8c909f] uppercase">
                        {item.id}
                      </div>
                      <div className="mt-1 font-mono text-[11px] tracking-[0.14em] text-[#8c909f] uppercase">
                        {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </section>

        {selectedSection === "overview" ? (
          <OverviewPanel
            project={project}
            deployment={deployment}
            deploymentUrl={deploymentUrl}
          />
        ) : null}

        {selectedSection === "environment" ? (
          <section className="border border-[#2a2d37] bg-[#11141c]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2a2d37] px-4 py-3">
              <div>
                <div className="font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
                  Environment variables
                </div>
                <div className="mt-1 text-sm text-[#aab0c2]">
                  Save changes here, then redeploy to apply them to the running container.
                  `PORT` is reserved by the platform and is always forced to `3000`.
                </div>
              </div>
            </div>
            <EnvVarsEditor
              key={`${project.id}:${project.updatedAt}:${project.envVars.length}`}
              projectId={project.id}
              initialEnvVars={project.envVars}
              onError={(message) => setPageError(message)}
            />
          </section>
        ) : null}

        {selectedSection === "logs" ? (
          <section className="border border-[#2a2d37] bg-[#11141c]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2a2d37] px-4 py-3">
              <div>
                <div className="font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
                  Selected deployment
                </div>
                <div className="mt-1 text-sm text-[#eef1f8]">
                  {deployment
                    ? `${deployment.status.toLowerCase()} • ${new Date(
                        deployment.createdAt
                      ).toLocaleString()}`
                    : "No deployment selected"}
                </div>
              </div>
              {deployment ? (
                <button
                  type="button"
                  onClick={async () => {
                    setPageError(null)

                    try {
                      await deleteDeploymentMutation.mutateAsync({
                        projectId: project.id,
                        deploymentId: deployment.id,
                      })
                    } catch (error) {
                      setPageError(
                        error instanceof ApiError
                          ? error.message
                          : "Unable to delete deployment."
                      )
                    }
                  }}
                  disabled={deleteDeploymentMutation.isPending}
                  className="inline-flex h-10 items-center gap-2 border border-[#4b2a2f] bg-[#241519] px-4 text-sm text-[#ffb4ab] transition-colors hover:border-[#654048] hover:bg-[#2e1a20] disabled:opacity-60"
                >
                  <Trash2 className="size-4" />
                  Delete deployment
                </button>
              ) : null}
            </div>

            {deployment?.lastError ? (
              <div className="border-b border-[#3d2328] bg-[#1f1418] px-4 py-3 text-sm text-[#ffb4ab]">
                {deployment.lastError}
              </div>
            ) : null}

            <div className="space-y-5 px-4 py-4">
              <LogPanel
                title="Runtime logs"
                content={deployment?.runtimeLogs}
                empty="No runtime logs recorded yet."
              />
              <LogPanel
                title="Build logs"
                content={deployment?.buildLogs}
                empty="No build logs recorded yet."
              />
            </div>
          </section>
        ) : null}

        {selectedSection === "settings" ? (
          <section className="space-y-5">
            <section className="border border-[#2a2d37] bg-[#11141c]">
              <div className="border-b border-[#2a2d37] px-4 py-3">
                <div className="font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
                  Project settings
                </div>
              </div>
              <div className="grid gap-4 px-4 py-4 md:grid-cols-2">
                <MetricCard label="Repository" value={`${project.repoOwner}/${project.repoName}`} muted={false} />
                <MetricCard label="Platform port" value="3000" muted={false} />
              </div>
            </section>

            <section className="border border-[#4b2a2f] bg-[#181116]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3d2328] px-4 py-3">
                <div>
                  <div className="font-mono text-[11px] tracking-[0.18em] text-[#c98795] uppercase">
                    Danger zone
                  </div>
                  <div className="mt-1 text-sm text-[#dcb6bf]">
                    Delete the project and all local deployment containers.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    setPageError(null)

                    try {
                      await deleteProjectMutation.mutateAsync(project.id)
                      router.push("/dashboard")
                    } catch (error) {
                      setPageError(
                        error instanceof ApiError
                          ? error.message
                          : "Unable to delete project."
                      )
                    }
                  }}
                  disabled={deleteProjectMutation.isPending}
                  className="inline-flex h-10 items-center gap-2 border border-[#6e3a43] bg-[#26171c] px-4 text-sm text-[#ffb4ab] transition-colors hover:border-[#8b4e59] hover:bg-[#321d24] disabled:opacity-60"
                >
                  <Trash2 className="size-4" />
                  {deleteProjectMutation.isPending ? "Deleting..." : "Delete project"}
                </button>
              </div>
            </section>
          </section>
        ) : null}
      </div>
    </DashboardShell>
  )
}

function OverviewPanel({
  project,
  deployment,
  deploymentUrl,
}: {
  project: Project
  deployment: Project["deployments"][number] | null
  deploymentUrl: string | null
}) {
  return (
    <section className="border border-[#2a2d37] bg-[#11141c]">
      <div className="border-b border-[#2a2d37] px-4 py-3">
        <div className="font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
          Overview
        </div>
      </div>
      <div className="grid gap-4 px-4 py-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="border border-[#2a2d37] bg-[#0f131a] p-4">
            <div className="font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
              Current deployment
            </div>
            <div className="mt-3 space-y-2 text-sm text-[#cfd5e4]">
              <div>Status: {deployment?.status.toLowerCase() ?? "no deployments"}</div>
              <div>ID: {deployment?.id ?? "Not available"}</div>
              <div>
                Created:{" "}
                {deployment ? new Date(deployment.createdAt).toLocaleString() : "Not available"}
              </div>
              <div>Host port: {deployment?.hostPort ?? "Not running"}</div>
            </div>
          </div>
          <div className="border border-[#2a2d37] bg-[#0f131a] p-4">
            <div className="font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
              Runtime access
            </div>
            <div className="mt-3 text-sm text-[#cfd5e4]">
              {deploymentUrl
                ? `Application is reachable at ${deploymentUrl}.`
                : "Start a deployment to get a local runtime URL."}
            </div>
          </div>
        </div>
        <div className="border border-[#2a2d37] bg-[#0f131a] p-4">
          <div className="font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
            Repository
          </div>
          <div className="mt-3 space-y-2 text-sm text-[#cfd5e4]">
            <div>{project.repoOwner}/{project.repoName}</div>
            <div>Branch: {project.branch}</div>
            <div>Saved env vars: {project.envVars.length}</div>
            <div>Total deployments: {project.deployments.length}</div>
          </div>
        </div>
      </div>
    </section>
  )
}

function EnvVarsEditor({
  projectId,
  initialEnvVars,
  onError,
}: {
  projectId: string
  initialEnvVars: Project["envVars"]
  onError: (message: string | null) => void
}) {
  const updateEnvVarsMutation = useUpdateProjectEnvVarsMutation()
  const [envVars, setEnvVars] = React.useState<Array<EditableEnvVar>>(
    initialEnvVars.length > 0
      ? initialEnvVars.map((envVar) => ({
          id: envVar.id,
          key: envVar.key,
          value: envVar.value,
          isEditing: false,
        }))
      : [createEditableEnvVar()]
  )

  const handleEnvVarPaste = React.useCallback(
    (index: number, text: string) => {
      const parsedEnvVars = parseEnvVarsFromPaste(text)

      if (!parsedEnvVars) {
        return false
      }

      setEnvVars((current) => [
        ...current.slice(0, index),
        ...parsedEnvVars,
        ...current.slice(index + 1),
      ])

      return true
    },
    []
  )

  return (
    <div className="space-y-3 px-4 py-4">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setEnvVars((current) => [...current, createEditableEnvVar()])}
          className="inline-flex h-10 items-center justify-center border border-[#2a2d37] bg-[#151821] px-4 text-sm text-[#eef1f8] transition-colors hover:border-[#424754] hover:bg-[#1b1f28]"
        >
          Add variable
        </button>
        <button
          type="button"
          onClick={async () => {
            onError(null)
            const normalizedEnvVars = normalizeEnvVars(envVars)
            setEnvVars(
              normalizedEnvVars.length > 0
                ? normalizedEnvVars.map((envVar) => ({
                    ...envVar,
                    isEditing: false,
                  }))
                : [createEditableEnvVar()]
            )

            try {
              await updateEnvVarsMutation.mutateAsync({
                projectId,
                payload: {
                  envVars: normalizedEnvVars.map(({ key, value }) => ({ key, value })),
                },
              })
            } catch (error) {
              onError(
                error instanceof ApiError
                  ? error.message
                  : "Unable to save environment variables."
              )
            }
          }}
          disabled={updateEnvVarsMutation.isPending}
          className="inline-flex h-10 items-center justify-center border border-[#4d8eff] bg-[#4d8eff] px-4 text-sm font-medium text-[#05152f] transition-colors hover:border-[#79a8ff] hover:bg-[#79a8ff] disabled:opacity-60"
        >
          {updateEnvVarsMutation.isPending ? "Saving..." : "Save env vars"}
        </button>
      </div>
      <p className="text-sm text-[#8c909f]">
        Paste `.env` lines like `DATABASE_URL=...` and they will be split into key
        and value automatically. Empty assignments such as `HOST=` are also valid.
        `PORT` is ignored during deployment because the platform binds the app on
        port `3000`.
      </p>

      {envVars.map((envVar, index) => (
        <div
          key={envVar.id}
          className="grid gap-3 border border-[#2a2d37] bg-[#0f131a] p-3 lg:grid-cols-[1fr_1.4fr_auto]"
        >
          <div className="block">
            <span className="mb-2 block font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
              Key
            </span>
            {envVar.isEditing ? (
              <input
                value={envVar.key}
                onChange={(event) => {
                  const value = event.target.value
                  setEnvVars((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, key: value } : item
                    )
                  )
                }}
                onPaste={(event) => {
                  if (handleEnvVarPaste(index, event.clipboardData.getData("text"))) {
                    event.preventDefault()
                  }
                }}
                placeholder="MONGO_URI"
                className="h-11 w-full border border-[#2a2d37] bg-[#11141c] px-3 text-sm text-[#edf0f7] outline-none transition-colors focus:border-[#4d8eff]"
              />
            ) : (
              <div className="flex h-11 items-center border border-[#2a2d37] bg-[#11141c] px-3 text-sm text-[#eef1f8]">
                {envVar.key || <span className="text-[#8c909f]">Empty key</span>}
              </div>
            )}
          </div>
          <div className="block">
            <span className="mb-2 block font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
              Value
            </span>
            {envVar.isEditing ? (
              <input
                value={envVar.value}
                onChange={(event) => {
                  const value = event.target.value
                  setEnvVars((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, value } : item
                    )
                  )
                }}
                onPaste={(event) => {
                  if (handleEnvVarPaste(index, event.clipboardData.getData("text"))) {
                    event.preventDefault()
                  }
                }}
                placeholder="mongodb://..."
                className="h-11 w-full border border-[#2a2d37] bg-[#11141c] px-3 text-sm text-[#edf0f7] outline-none transition-colors focus:border-[#4d8eff]"
              />
            ) : (
              <div className="flex h-11 items-center overflow-hidden border border-[#2a2d37] bg-[#11141c] px-3 text-sm text-[#cfd5e4]">
                <span className="truncate">{envVar.value || "Empty value"}</span>
              </div>
            )}
          </div>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() =>
                setEnvVars((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, isEditing: !item.isEditing }
                      : item
                  )
                )
              }
              className={`inline-flex h-11 w-11 items-center justify-center border transition-colors ${
                envVar.isEditing
                  ? "border-[#4d8eff] bg-[#141d2d] text-[#adc6ff] hover:border-[#79a8ff]"
                  : "border-[#2a2d37] bg-[#11141c] text-[#cfd5e4] hover:border-[#424754] hover:bg-[#151821] hover:text-[#eef1f8]"
              }`}
              aria-label={envVar.isEditing ? "Finish editing variable" : "Edit variable"}
              title={envVar.isEditing ? "Finish editing" : "Edit"}
            >
              {envVar.isEditing ? <Check className="size-4" /> : <Pencil className="size-4" />}
            </button>
            <button
              type="button"
              onClick={() =>
                setEnvVars((current) =>
                  current.length === 1
                    ? [createEditableEnvVar()]
                    : current.filter((_, itemIndex) => itemIndex !== index)
                )
              }
              className="inline-flex h-11 w-11 items-center justify-center border border-[#53313a] bg-[#26171c] text-[#ffb4ab] transition-colors hover:border-[#7c4651] hover:bg-[#301b21]"
              aria-label="Delete variable"
              title="Delete"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function MetricCard({
  label,
  value,
  muted,
}: {
  label: string
  value: string
  muted: boolean
}) {
  return (
    <div className="border border-[#2a2d37] bg-[#11141c] px-4 py-4">
      <div className="font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
        {label}
      </div>
      <div className={`mt-2 text-sm ${muted ? "text-[#8c909f]" : "text-[#eef1f8]"}`}>
        {value}
      </div>
    </div>
  )
}

function LogPanel({
  title,
  content,
  empty,
}: {
  title: string
  content: string | null | undefined
  empty: string
}) {
  return (
    <div className="border border-[#2a2d37] bg-[#0d1016]">
      <div className="border-b border-[#2a2d37] px-4 py-3">
        <div className="font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
          {title}
        </div>
      </div>
      <pre className="min-h-[320px] overflow-auto px-4 py-4 font-mono text-xs leading-6 text-[#cfd5e4] whitespace-pre-wrap">
        {content?.trim() ? content : empty}
      </pre>
    </div>
  )
}
