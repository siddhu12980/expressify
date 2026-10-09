"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { ArrowRight, CheckCircle2, GitBranch, ShieldCheck } from "lucide-react"

import { useLoginMutation, useSignupMutation } from "@/features/auth/auth.hooks"
import { startGitHubAuth } from "@/features/github/github.hooks"
import { useAuthHydrated } from "@/hooks/use-auth-hydrated"
import { ApiError } from "@/lib/api"
import { useAuthStore } from "@/stores/auth-store"

type AuthShellProps = {
  mode: "login" | "signup"
}

const authCopy = {
  login: {
    eyebrow: "Return to workspace",
    title: "Sign in and continue your deployment session.",
    subtitle:
      "Use GitHub for the fastest path back to your projects, or sign in with the account credentials already attached to your workspace.",
    primaryCta: "Sign in with GitHub",
    submitLabel: "Login",
    footerPrompt: "Need an account?",
    footerLink: "Create one",
    footerHref: "/signup",
  },
  signup: {
    eyebrow: "Open a new workspace",
    title: "Create your account and connect the first repository.",
    subtitle:
      "Start with GitHub to import a project immediately, or create a local account first and attach GitHub after signup.",
    primaryCta: "Continue with GitHub",
    submitLabel: "Create account",
    footerPrompt: "Already have an account?",
    footerLink: "Login",
    footerHref: "/login",
  },
} as const

const authBenefits = [
  "Import a GitHub repository and choose the branch to deploy.",
  "Store environment variables without baking secrets into the image.",
  "Track build logs, live status, and crash loop errors from one workspace.",
]

function Field({
  label,
  type,
  placeholder,
  value,
  onChange,
}: {
  label: string
  type: string
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
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="h-11 w-full rounded-[4px] border border-[#2a2d37] bg-[#0f131a] px-3 text-sm text-[#edf0f7] transition-colors outline-none placeholder:text-[#5f667a] focus:border-[#4d8eff]"
      />
    </label>
  )
}

export function AuthShell({ mode }: AuthShellProps) {
  const copy = authCopy[mode]
  const router = useRouter()
  const hydrated = useAuthHydrated()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const loginMutation = useLoginMutation()
  const signupMutation = useSignupMutation()
  const mutation = mode === "login" ? loginMutation : signupMutation
  const [form, setForm] = React.useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [formError, setFormError] = React.useState<string | null>(null)

  function updateField(field: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormError(null)
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }))
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (!hydrated) {
      return
    }

    if (mode === "signup" && form.password !== form.confirmPassword) {
      setFormError("Passwords do not match.")
      return
    }

    try {
      await mutation.mutateAsync({
        email: form.email,
        password: form.password,
      })
      router.push("/dashboard")
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Unable to complete authentication."
      )
    }
  }

  React.useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace("/dashboard")
    }
  }, [hydrated, isAuthenticated, router])

  return (
    <main className="min-h-screen bg-[#12131a] text-[#e2e1eb]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] gap-6 px-4 py-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <section className="flex flex-col py-2 sm:py-4 lg:py-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-[4px] border border-[#33343c] bg-[#171922] font-mono text-xs text-[#adc6ff]">
                MV
              </div>
              <div>
                <div className="text-sm font-semibold text-[#f3f4f8]">
                  Mini Vercel
                </div>
                <div className="font-mono text-[11px] tracking-[0.2em] text-[#8c909f] uppercase">
                  Public access
                </div>
              </div>
            </Link>
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-[4px] border border-[#2a2d37] bg-[#161922] px-3 text-sm text-[#c2c6d6] transition-colors hover:border-[#424754] hover:text-[#eef1f8]"
            >
              Back home
            </Link>
          </div>

          <div className="mt-12">
            <div className="inline-flex items-center gap-2 rounded-[4px] border border-[#2a2d37] bg-[#141720] px-3 py-1 font-mono text-[11px] tracking-[0.24em] text-[#adc6ff] uppercase">
              <span className="size-1.5 rounded-full bg-[#4d8eff]" />
              {copy.eyebrow}
            </div>
            <h1 className="mt-6 max-w-xl text-3xl font-semibold tracking-[-0.02em] text-[#f7f8fb] sm:text-4xl">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#c2c6d6]">
              {copy.subtitle}
            </p>
          </div>

          <div className="mt-10 space-y-4 border-t border-[#2a2d37] pt-6">
            {authBenefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-start gap-3 border-b border-[#232833] pb-4 last:border-b-0 last:pb-0"
              >
                <CheckCircle2 className="mt-0.5 size-4 text-[#adc6ff]" />
                <span className="text-sm leading-6 text-[#d8dbe7]">
                  {benefit}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-10">
            <div className="flex items-start justify-between gap-4 border-t border-[#2a2d37] pt-5">
              <div>
                <div className="font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
                  Access mode
                </div>
                <div className="mt-3 max-w-md text-sm leading-6 text-[#c2c6d6]">
                  GitHub OAuth is the primary path for repository import. Local
                  credentials remain useful for direct product access and later
                  provider expansion.
                </div>
              </div>
              <ShieldCheck className="mt-1 size-4 shrink-0 text-[#adc6ff]" />
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full rounded-[6px] border border-[#2a2d37] bg-[#0f1118] p-6 sm:p-8 lg:p-10">
            <div className="border-b border-[#2a2d37] pb-6">
              <div className="font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
                Authentication
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-[#f5f7fb]">
                {mode === "login" ? "Welcome back" : "Create workspace access"}
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={startGitHubAuth}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[4px] border border-[#33343c] bg-[#171922] px-4 text-sm font-medium text-[#eef1f8] transition-colors hover:border-[#4a4d58] hover:bg-[#1c1f28]"
              >
                <GitBranch className="size-4" />
                {copy.primaryCta}
              </button>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-[#2a2d37]" />
                <span className="font-mono text-[11px] tracking-[0.18em] text-[#6e7588] uppercase">
                  or use email
                </span>
                <div className="h-px flex-1 bg-[#2a2d37]" />
              </div>

              <form className="space-y-4" onSubmit={onSubmit}>
                {mode === "signup" ? (
                  <Field
                    label="Full name"
                    type="text"
                    placeholder="Ari Sharma"
                    value={form.fullName}
                    onChange={updateField("fullName")}
                  />
                ) : null}
                <Field
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={updateField("email")}
                />
                <Field
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={updateField("password")}
                />
                {mode === "signup" ? (
                  <Field
                    label="Confirm password"
                    type="password"
                    placeholder="Confirm your password"
                    value={form.confirmPassword}
                    onChange={updateField("confirmPassword")}
                  />
                ) : null}

                {formError ? (
                  <div className="rounded-[4px] border border-[#53313a] bg-[#26171c] px-3 py-2 text-sm text-[#ffb4ab]">
                    {formError}
                  </div>
                ) : null}

                <div className="flex items-start justify-between gap-3 text-sm text-[#aab0c2]">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4 rounded-[3px] border border-[#2a2d37] bg-[#0f131a]"
                    />
                    <span>
                      {mode === "login"
                        ? "Keep me signed in"
                        : "I agree to the platform terms"}
                    </span>
                  </label>
                  {mode === "login" ? (
                    <Link
                      href="#"
                      className="text-[#adc6ff] transition-colors hover:text-[#d8e2ff]"
                    >
                      Forgot password
                    </Link>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={mutation.isPending || !hydrated}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[4px] border border-[#4d8eff] bg-[#4d8eff] px-4 text-sm font-medium text-[#05152f] transition-colors hover:border-[#79a8ff] hover:bg-[#79a8ff]"
                >
                  {mutation.isPending ? "Working..." : copy.submitLabel}
                  <ArrowRight className="size-4" />
                </button>
              </form>
            </div>

            <div className="mt-6 border-t border-[#2a2d37] pt-6 text-sm text-[#aab0c2]">
              {copy.footerPrompt}{" "}
              <Link
                href={copy.footerHref}
                className="text-[#adc6ff] transition-colors hover:text-[#d8e2ff]"
              >
                {copy.footerLink}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
