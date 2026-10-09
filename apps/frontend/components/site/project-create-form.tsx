"use client"

import { useRouter } from "next/navigation"
import * as React from "react"

import { useCreateProjectMutation } from "@/features/projects/projects.hooks"
import type { GitHubInstallation } from "@/features/github/github.types"
import type { GitHubRepository } from "@/features/github/github.types"
import { ApiError } from "@/lib/api"

export function ProjectCreateForm({
  installation,
  repositories,
}: {
  installation: GitHubInstallation
  repositories: GitHubRepository[]
}) {
  const router = useRouter()
  const mutation = useCreateProjectMutation()
  const [form, setForm] = React.useState({
    githubRepositoryId: "",
    name: "",
    repoOwner: "",
    repoName: "",
    repoUrl: "",
    branch: "main",
  })
  const [error, setError] = React.useState<string | null>(null)

  function updateField(field: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      setError(null)
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }))
    }
  }

  function onRepositoryChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const repositoryId = event.target.value
    const repository = repositories.find((item) => item.id === repositoryId)

    if (!repository) {
      setForm((current) => ({
        ...current,
        githubRepositoryId: "",
        name: "",
        repoOwner: "",
        repoName: "",
        repoUrl: "",
        branch: "main",
      }))
      return
    }

    setError(null)
    setForm({
      githubRepositoryId: repository.id,
      name: repository.name,
      repoOwner: repository.ownerLogin,
      repoName: repository.name,
      repoUrl: repository.repoUrl,
      branch: repository.defaultBranch || "main",
    })
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    try {
      await mutation.mutateAsync({
        ...form,
        githubInstallationId: installation.id,
        githubRepositoryId: form.githubRepositoryId,
      })
      router.push("/dashboard")
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : "Unable to create project."
      )
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <div className="rounded-[4px] border border-[#2a2d37] bg-[#141821] px-3 py-3 text-sm text-[#d8dbe7] md:col-span-2">
        Connected GitHub installation:{" "}
        <span className="font-medium text-[#eef1f8]">
          {installation.githubAccountLogin}
        </span>
      </div>
      <label className="block md:col-span-2">
        <span className="mb-2 block font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
          Repository
        </span>
        <select
          value={form.githubRepositoryId}
          onChange={onRepositoryChange}
          className="h-11 w-full border border-[#2a2d37] bg-[#0f131a] px-3 text-sm text-[#edf0f7] outline-none transition-colors focus:border-[#4d8eff]"
        >
          <option value="">Select a repository</option>
          {repositories.map((repository) => (
            <option key={repository.id} value={repository.id}>
              {repository.fullName}
            </option>
          ))}
        </select>
      </label>

      <Field
        label="Project name"
        placeholder="Mini Vercel demo"
        value={form.name}
        onChange={updateField("name")}
      />
      <ReadOnlyField label="GitHub owner" value={form.repoOwner} />
      <ReadOnlyField label="Repository name" value={form.repoName} />
      <ReadOnlyField label="Branch" value={form.branch} />
      <div className="md:col-span-2">
        <ReadOnlyField
          label="Repository URL"
          value={form.repoUrl}
        />
      </div>

      {error ? (
        <div className="rounded-[4px] border border-[#53313a] bg-[#26171c] px-3 py-2 text-sm text-[#ffb4ab] md:col-span-2">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end md:col-span-2">
        <button
          type="submit"
          disabled={mutation.isPending || !form.githubRepositoryId}
          className="inline-flex h-10 items-center justify-center border border-[#4d8eff] bg-[#4d8eff] px-4 text-sm font-medium text-[#05152f] transition-colors hover:border-[#79a8ff] hover:bg-[#79a8ff] disabled:opacity-60"
        >
          {mutation.isPending ? "Creating..." : "Create project"}
        </button>
      </div>
    </form>
  )
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
        {label}
      </span>
      <input
        value={value}
        readOnly
        className="h-11 w-full border border-[#2a2d37] bg-[#141821] px-3 text-sm text-[#cfd5e4] outline-none"
      />
    </label>
  )
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
        {label}
      </span>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-11 w-full border border-[#2a2d37] bg-[#0f131a] px-3 text-sm text-[#edf0f7] transition-colors outline-none placeholder:text-[#5f667a] focus:border-[#4d8eff]"
      />
    </label>
  )
}
