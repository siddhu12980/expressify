<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:architect-mode-design-rules -->
# Architect Mode UI Blueprint

Before changing any UI, read `DESIGN.md`.

The current design direction is locked unless the user explicitly asks to redesign it. Future pages must preserve the same calm midnight workspace, sharp architectural components, left workflow rail, restrained top bar, right intelligence/data panel patterns, typography, spacing, colors, borders, and interaction style already established in `app/page.tsx` and `app/chat/page.tsx`.

Do not introduce a different sidebar, different visual language, generic SaaS dashboard styling, generic chatbot bubbles, decorative gradients/glows, or one-off component styling that conflicts with the blueprint.

All UI work must be mobile-compatible in the same pass. Do not leave responsive behavior for later. Verify that components remain readable, tappable, non-overlapping, and free of horizontal scroll at mobile widths, while reusing the same component patterns across breakpoints.
<!-- END:architect-mode-design-rules -->

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
