import Link from "next/link"
import {
  ArrowRight,
  Container,
  GitBranch,
  LayoutPanelTop,
  ShieldCheck,
  TerminalSquare,
} from "lucide-react"

const deploymentFlow = [
  {
    step: "01",
    title: "Import the repository",
    copy: "Connect GitHub and choose the branch you actually want to release.",
    icon: GitBranch,
  },
  {
    step: "02",
    title: "Validate the runtime",
    copy: "Check for Express, startup commands, and missing runtime settings before build.",
    icon: ShieldCheck,
  },
  {
    step: "03",
    title: "Deploy with visibility",
    copy: "Ship to a live URL with build logs, status, and a predictable runtime contract.",
    icon: LayoutPanelTop,
  },
]

const productSignals = [
  "GitHub import with branch selection",
  "Runtime checks before build",
  "Environment variables and live logs",
]

const heroSummary = [
  {
    label: "Input",
    value: "GitHub repo and branch",
  },
  {
    label: "Checks",
    value: "Express, scripts, env setup",
  },
  {
    label: "Output",
    value: "Live URL, logs, deploy status",
  },
]

const productPrinciples = [
  {
    title: "Reduce setup drift",
    copy: "The platform catches obvious configuration mistakes before users wait through a broken deployment.",
    icon: TerminalSquare,
  },
  {
    title: "Keep runtime signals visible",
    copy: "Logs, deploy states, and crash behavior stay close to the deployment instead of disappearing into tooling.",
    icon: Container,
  },
  {
    title: "Keep the contract small",
    copy: "A fixed port, attached env vars, and predictable limits make the hosting model easier to understand.",
    icon: ShieldCheck,
  },
]

function SiteLink({
  href,
  children,
  variant = "primary",
}: {
  href: string
  children: React.ReactNode
  variant?: "primary" | "secondary" | "ghost"
}) {
  const className =
    variant === "primary"
      ? "border border-[#4d8eff] bg-[#4d8eff] text-[#05152f] hover:border-[#79a8ff] hover:bg-[#79a8ff]"
      : variant === "secondary"
        ? "border border-[#33343c] bg-[#171922] text-[#e2e1eb] hover:border-[#4a4d58] hover:bg-[#1c1f28]"
        : "border border-transparent bg-transparent text-[#c2c6d6] hover:border-[#2a2d37] hover:bg-[#171922] hover:text-[#e2e1eb]"

  return (
    <Link
      href={href}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-[4px] px-4 text-sm font-medium transition-colors ${className}`}
    >
      {children}
    </Link>
  )
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-[4px] border border-[#2a2d37] bg-[#141720] px-3 py-1 font-mono text-[11px] tracking-[0.24em] text-[#adc6ff] uppercase">
      <span className="size-1.5 rounded-full bg-[#4d8eff]" />
      {children}
    </div>
  )
}

export default function Page() {
  return (
    <main className="min-h-screen bg-[#12131a] text-[#e2e1eb]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 pt-4 pb-10 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-20 mb-8 rounded-[6px] border border-[#2a2d37]/90 bg-[#12131a]/90 px-4 py-3 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-[4px] border border-[#33343c] bg-[#171922] font-mono text-xs text-[#adc6ff]">
                  MV
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#f3f4f8]">
                    Mini Vercel
                  </div>
                  <div className="font-mono text-[11px] tracking-[0.2em] text-[#8c909f] uppercase">
                    Deploy Express with structure
                  </div>
                </div>
              </Link>
              <nav className="hidden items-center gap-2 md:flex">
                <SiteLink href="#workflow" variant="ghost">
                  Workflow
                </SiteLink>
                <SiteLink href="#system" variant="ghost">
                  System
                </SiteLink>
                <SiteLink href="#access" variant="ghost">
                  Access
                </SiteLink>
              </nav>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <SiteLink href="/login" variant="secondary">
                Login
              </SiteLink>
              <SiteLink href="/signup">
                Start with GitHub
                <ArrowRight className="size-4" />
              </SiteLink>
            </div>
          </div>
        </header>

        <section className="grid gap-8 border-b border-[#2a2d37] pb-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="pt-2">
            <SectionEyebrow>Student deployment workspace</SectionEyebrow>
            <div className="mt-5 max-w-3xl">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.02em] text-[#f7f8fb] sm:text-5xl lg:text-[3.95rem] lg:leading-[1.03]">
                Ship an Express repo from GitHub without turning deployment
                into another toolchain to learn.
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#c2c6d6] sm:text-base">
                Mini Vercel gives students and small teams a disciplined path
                from repository import to live URL. Connect a branch, verify
                the runtime, add environment variables, and keep logs visible
                when something fails.
              </p>
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <SiteLink href="/signup">
                Create account
                <ArrowRight className="size-4" />
              </SiteLink>
              <SiteLink href="/login" variant="secondary">
                Sign in with GitHub
              </SiteLink>
            </div>
            <div className="mt-8 grid gap-4 border-t border-[#2a2d37] pt-6 md:grid-cols-3">
              {heroSummary.map((item) => (
                <div
                  key={item.label}
                  className="border-l border-[#2a2d37] pl-4 first:border-l-0 first:pl-0"
                >
                  <div className="font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
                    {item.label}
                  </div>
                  <div className="mt-2 text-sm leading-6 text-[#d8dbe7]">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="border border-[#2a2d37] bg-[#10131b] p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[11px] tracking-[0.22em] text-[#8c909f] uppercase">
                Deployment path
              </div>
              <div className="rounded-full border border-[#28406d] bg-[#12233f] px-2.5 py-1 font-mono text-[11px] tracking-[0.18em] text-[#adc6ff] uppercase">
                v0 scope
              </div>
            </div>
            <div className="mt-5 grid gap-4 border-b border-[#2a2d37] pb-5">
              <div>
                <div className="text-xl font-medium text-[#f5f7fb]">
                  The landing page should preview the product in one pass.
                </div>
                <p className="mt-3 max-w-md text-sm leading-6 text-[#aab0c2]">
                  Keep the core path explicit: repo in, checks run, deployment
                  out, runtime visible.
                </p>
              </div>
              <div className="grid gap-2 text-sm text-[#d7dbe8]">
                {productSignals.map((signal) => (
                  <div key={signal} className="flex items-start gap-3">
                    <span className="mt-2 size-1.5 rounded-full bg-[#4d8eff]" />
                    <span className="leading-6">{signal}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {deploymentFlow.map(({ step, title, copy, icon: Icon }) => (
                <div
                  key={step}
                  className="grid gap-3 border-b border-[#232833] pb-4 last:border-b-0 last:pb-0 sm:grid-cols-[72px_1fr]"
                >
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
                      {step}
                    </div>
                    <div className="flex size-8 items-center justify-center rounded-full border border-[#33343c] bg-[#171c27]">
                      <Icon className="size-4 text-[#adc6ff]" />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#eef1f8]">
                      {title}
                    </div>
                    <div className="mt-1 text-sm leading-6 text-[#aab0c2]">
                      {copy}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section
          id="workflow"
          className="mt-10 grid gap-10 border-b border-[#2a2d37] pb-10 lg:grid-cols-[0.9fr_1.1fr]"
        >
          <div>
            <SectionEyebrow>Why it stays readable</SectionEyebrow>
            <h2 className="mt-5 text-2xl font-semibold tracking-[-0.02em] text-[#f5f7fb] sm:text-3xl">
              The product stays focused on the few signals users actually need
              during a deploy.
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#c2c6d6]">
              Mini Vercel does not need a dashboard full of abstractions on day
              one. It needs a clear deployment flow, visible failure states,
              and a runtime model that people can understand quickly.
            </p>
          </div>
          <div className="space-y-5">
            {productPrinciples.map(({ title, copy, icon: Icon }, index) => (
              <article
                key={title}
                className="grid gap-4 border-b border-[#2a2d37] pb-5 last:border-b-0 last:pb-0 sm:grid-cols-[72px_1fr_auto]"
              >
                <div className="font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
                  0{index + 1}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[#f7f8fb]">
                    {title}
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-[#aab0c2]">
                    {copy}
                  </p>
                </div>
                <div className="flex items-start justify-start sm:justify-end">
                  <div className="flex size-10 items-center justify-center rounded-full border border-[#33343c] bg-[#12151d]">
                    <Icon className="size-4 text-[#adc6ff]" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="system" className="mt-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <SectionEyebrow>System view</SectionEyebrow>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.02em] text-[#f5f7fb] sm:text-3xl">
                The product promise maps directly to your deployment pipeline.
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#c2c6d6]">
                Users connect GitHub, choose a branch, pass Express detection,
                configure env vars, and get a live deployment with logs. The
                landing page should make that model obvious without burying it
                in extra panels.
              </p>
            </div>
            <div className="border-t border-[#2a2d37]">
              <div className="grid gap-0 sm:grid-cols-2">
                <div className="border-b border-[#2a2d37] py-5 pr-0 sm:pr-6">
                  <div className="font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
                    Input
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-sm text-[#d7dbe8]">
                    <GitBranch className="size-4 text-[#adc6ff]" />
                    GitHub repo + branch selection
                  </div>
                </div>
                <div className="border-b border-[#2a2d37] py-5 sm:pl-6">
                  <div className="font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
                    Checks
                  </div>
                  <div className="mt-3 text-sm leading-6 text-[#d7dbe8]">
                    Package presence, Express detection, start script, fallback
                    validation.
                  </div>
                </div>
                <div className="border-b border-[#2a2d37] py-5 pr-0 sm:border-b-0 sm:pr-6">
                  <div className="font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
                    Runtime
                  </div>
                  <div className="mt-3 text-sm leading-6 text-[#d7dbe8]">
                    Encrypted env vars, fixed port injection, memory and CPU
                    limits, restart policy.
                  </div>
                </div>
                <div className="py-5 sm:pl-6">
                  <div className="font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
                    Output
                  </div>
                  <div className="mt-3 text-sm leading-6 text-[#d7dbe8]">
                    Live subdomain, log stream, deployment status, crash
                    visibility for debugging.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="access" className="mt-10 border-t border-[#2a2d37] pt-10">
          <div className="flex flex-col gap-6 border border-[#2a2d37] bg-[#10131b] p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <SectionEyebrow>Access</SectionEyebrow>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.02em] text-[#f5f7fb] sm:text-3xl">
                Start with GitHub, then move straight into the deployment
                workspace.
              </h2>
              <p className="mt-4 text-[15px] leading-7 text-[#c2c6d6]">
                The auth flows stay restrained and use the same product
                language, so the first transition from marketing to workspace
                feels continuous.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <SiteLink href="/login" variant="secondary">
                Login
              </SiteLink>
              <SiteLink href="/signup">
                Create account
                <ArrowRight className="size-4" />
              </SiteLink>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
