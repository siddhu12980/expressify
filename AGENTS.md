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
