---
name: Architectural Precision
colors:
  surface: '#12131a'
  surface-dim: '#12131a'
  surface-bright: '#383940'
  surface-container-lowest: '#0c0e14'
  surface-container-low: '#1a1b22'
  surface-container: '#1e1f26'
  surface-container-high: '#282a31'
  surface-container-highest: '#33343c'
  on-surface: '#e2e1eb'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#e2e1eb'
  inverse-on-surface: '#2f3037'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#4a4949'
  on-secondary-container: '#bab8b7'
  tertiary: '#c8c6c5'
  on-tertiary: '#303030'
  tertiary-container: '#929090'
  on-tertiary-container: '#2a2a2a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#e4e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1b1c1c'
  on-tertiary-fixed-variant: '#474746'
  background: '#12131a'
  on-background: '#e2e1eb'
  surface-variant: '#33343c'
typography:
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: 0em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin: 32px
  container-max: 1440px
---

## Brand & Style
This design system is engineered for professional environments where clarity and technical authority are paramount. The brand personality is rooted in architectural discipline—precise, calm, and intellectually rigorous. It avoids the fleeting trends of consumer software in favor of a timeless, high-end tool aesthetic reminiscent of premium industrial design.

The visual direction follows a **Modern Minimalist** approach with a focus on structural integrity. Every element exists on a strict grid, emphasizing functional honesty. The emotional response should be one of quiet confidence and deep focus, providing a neutral but sophisticated canvas for complex architectural thought.

## Colors
The "Midnight Workspace" palette is designed to reduce eye strain during long sessions of deep work. 

- **Primary (Architect Blue):** Used strictly as a functional accent for primary actions, focus states, and active indicators. It is the "ink" of the blueprint.
- **Backgrounds:** The foundation is #0A0A0A, providing a near-black canvas that allows content to recede or advance based on surface luminance.
- **Surfaces:** Tiered shades of Obsidian (#121212) and Slate (#18181B) define the workspace hierarchy.
- **Borders:** Subtle #262626 borders are used to define modular boundaries without creating visual noise.
- **Typography:** High-contrast White (#FAFAFA) for headings, Muted Gray (#A1A1AA) for body text, and Dark Gray (#52525B) for disabled or placeholder states.

## Typography
The typography system prioritizes legibility and technical precision. **Geist** is used for all primary UI and editorial content due to its clean, geometric construction and professional weight distribution. 

**JetBrains Mono** is introduced for labels, metadata, and technical specifications to lean into the "Architectural" aesthetic, suggesting a space where data and design intersect. Headings should utilize tight letter-spacing to feel "locked-in," while labels use expanded tracking for a refined, technical feel. All type should be rendered with grayscale anti-aliasing to maintain sharpness on dark backgrounds.

## Layout & Spacing
The layout relies on a strict **8px base grid** for macro-spacing and a **4px grid** for micro-adjustments. The philosophy is one of "Structured Openness"—generous whitespace that is always mathematically aligned.

- **Desktop:** A 12-column fluid grid with 24px gutters. Elements should snap to column starts to maintain a rigid, technical structure.
- **Panels:** Sidebars and utility panels use fixed widths (e.g., 280px or 320px) to provide a stable workspace.
- **Padding:** Internal card padding should be generous (24px or 32px) to allow content to breathe, emphasizing the premium nature of the tool.

## Elevation & Depth
Depth is conveyed through **Tonal Layering** and **Subtle Outlines** rather than dramatic shadows. 

- **Level 0 (Background):** #0A0A0A. The base canvas.
- **Level 1 (Cards/Panels):** #121212 with a 1px border of #262626.
- **Level 2 (Popovers/Modals):** #18181B with a slightly brighter border (#3F3F46) and a very soft, high-diffusion shadow (0px 8px 24px rgba(0,0,0,0.5)).
- **Interactive Depth:** When an element is hovered, the border color shifts toward the accent or a lighter neutral; do not use "lift" or vertical movement. 
- **Glassmorphism:** Reserved exclusively for navigation bars that overlay content, using a subtle backdrop blur (12px) and a low-opacity #FFFFFF10 fill.

## Shapes
In line with the architectural theme, shapes are disciplined and sharp. A standard **4px radius (Soft)** is applied to buttons, input fields, and small UI components. This provides just enough softening to feel "designed" without appearing consumer-grade or playful. Larger containers and cards may use a **6px radius** to maintain visual proportion. Circular shapes are only permitted for status indicators or specific icon backdrops.

## Components
- **Buttons:** Primary buttons use the Architect Blue (#3B82F6) with white text. Secondary buttons are ghost-style with a #262626 border. No gradients; no rounded ends.
- **Input Fields:** Darker than the surface (#0A0A0A) with a subtle 1px border. Focus state is a 1px Architect Blue ring with no outer glow.
- **Cards:** Minimalist modular containers. Use #121212 background, #262626 border. Headers within cards should be separated by a 1px horizontal rule.
- **Lists:** Data-heavy lists use 1px dividers. Hover states for list items should use a subtle #FFFFFF05 (5% white) overlay.
- **Chips/Badges:** Small, rectangular with 2px radius. Use JetBrains Mono for the text. High-contrast monochromatic colors (Black background, White text) or muted tonal backgrounds.
- **Navigation:** Vertical sidebars are preferred for "workspace" tools, utilizing iconography that is thin-stroke (1.5px) and geometrically consistent.

## Architect Mode Locked UI Blueprint

This section is the project source of truth for future Architect Mode screens. Preserve this direction unless the user explicitly asks to redesign the product.

### Product Feel
- Architect Mode is a calm, technical planning workspace, not a generic chatbot, SaaS dashboard, or decorative AI landing page.
- The UI should feel like a professional architecture instrument: quiet, precise, structured, and easy to understand.
- Prefer clear user flow and readable content over visual novelty. Avoid gradients, glow-heavy AI effects, glass-heavy panels, large decorative shapes, and playful consumer styling.

### Core Layout Pattern
- Use a three-zone workspace on desktop:
  - Left fixed workflow rail: 280px wide, brand block at top, vertical journey/timeline below.
  - Center working area: the current task, chat session, canvas, recommendation, or export content.
  - Right intelligence/data panel: compact contextual summary, readiness, signals, missing items, and notes.
- Keep the left workflow rail visually consistent across pages. Do not invent a different sidebar for chat, export, or later steps.
- The main top bar should remain restrained: page/session title on the left; Save Draft and the circular profile badge on the right.
- Desktop pages should usually fit the viewport without page-level scroll when the screen is large enough. If content must scroll, confine scrolling to the main content region, not the whole shell.

### Left Workflow Rail
- Use the same steps and order unless product requirements change: Idea, Users, Features, Risks, Architecture, Export.
- Active step: `#1a1b22` surface with Architect Blue text/dot.
- Inactive steps: muted text `#8c909f`; hover state `#1a1b22` with text `#c2c6d6`.
- Timeline line: subtle `#282a31`; dots use the same ring treatment as the current home/chat pages.
- Export can have a larger vertical gap to imply the final package step.

### Chat And Guided Flow
- Chat is a support surface, not the whole product identity. Use chat input for natural entry, but show AI outputs as structured messages, notes, summaries, decision modules, and cards.
- Clarifying questions should appear near the chat input or in the central flow, not as noisy sidebar content.
- Option buttons for questions should stack vertically under the question and take the full available row. This allows 2-6 options without redesigning the component.
- User messages can be contained in subtle bordered blocks; Architect Mode responses should feel editorial and structured, not like generic bubbles.

### Panels And Cards
- Use tonal layering, not heavy shadows. Base `#12131a`, lower surface `#0c0e14`, raised surfaces `#1a1b22` / `#1e1f26`.
- Borders are the main separator: `#2a2d37`, `#33343c`, or `#424754`.
- Radius should stay sharp: 3-6px for most controls/cards. Circular shapes are only for avatar/status dots.
- Cards should have a clear reason to exist: structured read, architect note, captured context, missing requirements, recommendation, export item.

### Typography
- Headings: light/medium weight, tight but readable, no oversized marketing hero treatment inside the app.
- Body copy: concise, clear, product-language first. Avoid abstract labels like "Define the core intent" when simpler wording such as "Define your product" is clearer.
- Use mono text for labels, metadata, status, session context, and chips.
- Example/placeholder-style text can be displayed as muted blended text when helpful, but keep the actual user input in the chat bar.

### Mobile Compatibility Requirement
- Every new page/component must be mobile-compatible in the same implementation pass. Do not build desktop first and leave mobile for later.
- On mobile, fixed side panels should collapse into a simple top/header structure or stack below the main content.
- Controls must remain tappable, readable, and non-overlapping at 375px width.
- Reuse the same components and content hierarchy across breakpoints; do not create separate duplicate desktop/mobile component trees unless there is a strong reason.
- Before finishing UI work, mentally verify 375px, 768px, and desktop layouts for text overflow, hidden actions, and accidental horizontal scroll.
