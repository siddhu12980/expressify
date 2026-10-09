<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


<!-- BEGIN:architect-mode-design-rules -->
#  UI Blueprint

Before changing any UI, read `DESIGN.md`.

Do not introduce a different sidebar, different visual language, generic SaaS dashboard styling, generic chatbot bubbles, decorative gradients/glows, or one-off component styling that conflicts with the blueprint.

All UI work must be mobile-compatible in the same pass. Do not leave responsive behavior for later. Verify that components remain readable, tappable, non-overlapping, and free of horizontal scroll at mobile widths, while reusing the same component patterns across breakpoints.
<!-- END:architect-mode-design-rules -->
