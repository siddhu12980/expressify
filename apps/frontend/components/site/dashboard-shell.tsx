"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  FolderGit2,
  LayoutDashboard,
  LogOut,
  Plus,
  Rocket,
} from "lucide-react"

import { useAuthHydrated } from "@/hooks/use-auth-hydrated"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"

const navigation = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/new-project", label: "New Project", icon: Plus },
]

type DashboardRailItem = {
  key: string
  label: string
  meta?: string
  href?: string
  active?: boolean
  onSelect?: () => void
}

export function DashboardShell({
  title,
  subtitle,
  actions,
  children,
  railTitle,
  railCurrent,
  railItems = [],
}: {
  title: string
  subtitle: string
  actions?: React.ReactNode
  children: React.ReactNode
  railTitle?: string
  railCurrent?: {
    label: string
    href?: string
    meta?: string
  }
  railItems?: Array<DashboardRailItem>
}) {
  const pathname = usePathname()
  const router = useRouter()
  const hydrated = useAuthHydrated()
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)

  function logout() {
    clearSession()
    router.push("/login")
  }

  return (
    <main className="min-h-screen bg-[#12131a] text-[#e2e1eb]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] gap-6 px-4 py-4 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="flex flex-col border border-[#2a2d37] bg-[#0f1118]">
          <div className="border-b border-[#2a2d37] px-5 py-5">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-[4px] border border-[#33343c] bg-[#171922] font-mono text-xs text-[#adc6ff]">
                MV
              </div>
              <div>
                <div className="text-sm font-semibold text-[#f3f4f8]">
                  Mini Vercel
                </div>
                <div className="font-mono text-[11px] tracking-[0.2em] text-[#8c909f] uppercase">
                  Workspace
                </div>
              </div>
            </Link>
          </div>

          <div className="border-b border-[#2a2d37] px-5 py-5">
            <div className="font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
              Account
            </div>
            <div className="mt-3 text-sm text-[#eef1f8]">
              {hydrated ? (user?.email ?? "No session") : "Loading session"}
            </div>
          </div>

          <nav className="flex-1 px-3 py-4">
            <div className="space-y-2">
              {navigation.map(({ href, label, icon: Icon }) => {
                const active = pathname === href

                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 border px-3 py-3 text-sm transition-colors",
                      active
                        ? "border-[#3c5d97] bg-[#141d2d] text-[#eef1f8]"
                        : "border-transparent text-[#aab0c2] hover:border-[#2a2d37] hover:bg-[#151821] hover:text-[#eef1f8]"
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                )
              })}
            </div>

            {railTitle && (railCurrent || railItems.length > 0) ? (
              <div className="mt-6 border-t border-[#2a2d37] pt-4">
                <div className="px-2 font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
                  {railTitle}
                </div>

                {railCurrent ? (
                  railCurrent.href ? (
                    <Link
                      href={railCurrent.href}
                      className="mt-3 flex border border-[#3c5d97] bg-[#141d2d] px-3 py-3 text-[#eef1f8] transition-colors hover:border-[#4f74b3] hover:bg-[#182236]"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {railCurrent.label}
                        </div>
                        {railCurrent.meta ? (
                          <div className="mt-1 font-mono text-[11px] tracking-[0.14em] text-[#8c909f] uppercase">
                            {railCurrent.meta}
                          </div>
                        ) : null}
                      </div>
                    </Link>
                  ) : (
                    <div className="mt-3 border border-[#3c5d97] bg-[#141d2d] px-3 py-3 text-[#eef1f8]">
                      <div className="truncate text-sm font-medium">
                        {railCurrent.label}
                      </div>
                      {railCurrent.meta ? (
                        <div className="mt-1 font-mono text-[11px] tracking-[0.14em] text-[#8c909f] uppercase">
                          {railCurrent.meta}
                        </div>
                      ) : null}
                    </div>
                  )
                ) : null}

                {railItems.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {railItems.map((item) => {
                      const active = item.active ?? (item.href ? pathname === item.href : false)

                      const content = (
                        <>
                          <div className="text-sm font-medium">{item.label}</div>
                          {item.meta ? (
                            <div className="mt-1 font-mono text-[11px] tracking-[0.14em] text-[#8c909f] uppercase">
                              {item.meta}
                            </div>
                          ) : null}
                        </>
                      )

                      const className = cn(
                        "block w-full border px-3 py-3 text-left transition-colors",
                        active
                          ? "border-[#3c5d97] bg-[#141d2d] text-[#eef1f8]"
                          : "border-[#2a2d37] bg-[#11141c] text-[#cfd5e4] hover:border-[#424754] hover:bg-[#151821]"
                      )

                      if (item.onSelect) {
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={item.onSelect}
                            className={className}
                          >
                            {content}
                          </button>
                        )
                      }

                      return (
                        <Link key={item.key} href={item.href ?? "#"} className={className}>
                          {content}
                        </Link>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}
          </nav>

          <div className="border-t border-[#2a2d37] p-3">
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 border border-transparent px-3 py-3 text-sm text-[#aab0c2] transition-colors hover:border-[#2a2d37] hover:bg-[#151821] hover:text-[#eef1f8]"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </div>
        </aside>

        <section className="flex min-h-[70vh] flex-col border border-[#2a2d37] bg-[#0f1118]">
          <header className="flex flex-col gap-4 border-b border-[#2a2d37] px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="font-mono text-[11px] tracking-[0.18em] text-[#8c909f] uppercase">
                Dashboard
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-[#f5f7fb]">
                {title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aab0c2]">
                {subtitle}
              </p>
            </div>
            {actions ? (
              <div className="flex items-center gap-3">{actions}</div>
            ) : null}
          </header>

          <div className="flex-1 px-5 py-5">{children}</div>
        </section>
      </div>
    </main>
  )
}

export function DashboardPrimaryLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center justify-center gap-2 border border-[#4d8eff] bg-[#4d8eff] px-4 text-sm font-medium text-[#05152f] transition-colors hover:border-[#79a8ff] hover:bg-[#79a8ff]"
    >
      <Rocket className="size-4" />
      {children}
    </Link>
  )
}

export function DashboardEmptyState({
  title,
  copy,
  action,
}: {
  title: string
  copy: string
  action: React.ReactNode
}) {
  return (
    <div className="flex min-h-[420px] items-center justify-center border border-dashed border-[#2a2d37] bg-[#11141c] px-6 py-10">
      <div className="max-w-xl text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-[#2f3644] bg-[#141821]">
          <FolderGit2 className="size-6 text-[#adc6ff]" />
        </div>
        <h2 className="mt-6 text-2xl font-semibold tracking-[-0.02em] text-[#f5f7fb]">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-7 text-[#aab0c2]">{copy}</p>
        <div className="mt-6 flex justify-center">{action}</div>
      </div>
    </div>
  )
}
