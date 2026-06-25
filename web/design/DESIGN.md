# Design System Document

## 1. Overview & Creative North Star

### The Creative North Star: "Byte Mark"

This design system rejects the clinical sterility of modern SaaS and the rigid grids of traditional news sites. Instead, it embodies **Byte Mark**—a visual identity that combines high-end editorial sophistication with a technical, developer-friendly soul.

We achieve this through "Structured Play":

- **Intentional Asymmetry:** Overlapping elements and varying card sizes break the "template" look.
- **Tonal Depth:** Replacing harsh lines with soft, nested color shifts.
- **Tactile Interaction:** Buttons and cards don't just "hover"; they respond with organic, physics-based buoyancy.

The system is designed to make long-form technical content feel as light and inviting as a personal sketchbook, without sacrificing the authority of the information.

---

## 2. Colors

The palette utilizes soft, desaturated background tones paired with high-chroma interactive accents to guide the eye.

### Tone & Intent

- **Primary (`#00675d`) & Secondary (`#a02d70`):** Reserved exclusively for **semantic labels** — product/project type badges (e.g. "Product", "Experience") and in-article links. Do **not** use for UI chrome (navigation active states, tag filters, hover effects).
- **Tertiary (`#755600` / gold):** Delight moments only — use sparingly.
- **Surface Tiers:** We use the `surface-container` scale to create architectural depth.
- **The "No-Line" Rule:** 1px solid borders are strictly prohibited for sectioning. Boundaries must be defined solely through background color shifts.

### The "Glass & Gradient" Rule

To elevate the experience from "web app" to "digital editorial," use **Glassmorphism** for floating UI like the sticky navigation. Apply a semi-transparent `surface` color with a `backdrop-blur: 12px`.

### Dark Mode Surfaces

Dark mode uses a dark grey (not near-black) as the base to reduce eye strain and give surface tiers room to breathe:

- **Base (`surface`):** `#252a2d` — medium dark grey, not black
- **Lowest container:** `#1e2224` — slightly darker (sunken state)
- **Container stack:** Low → High → Highest lifts toward `#404548`

---

## 3. UI Chrome Pattern (B3 / M3 / S3)

All non-semantic UI chrome (navigation, tag filters, pagination, TOC, search, footer icons) follows one of three neutral patterns that avoid primary/secondary colour entirely:

### B3 — Weight shift (navigation, tag filters, blog cards)

Active state signals through typography weight — no background, no colour change. Two sub-variants depending on whether a size shift is appropriate:

**B3a — Weight + size** (blog cards, TOC, pagination): size reinforces hierarchy when layout is stable.

- **Active:** `font-extrabold text-base text-on-surface`
- **Inactive:** `font-medium text-sm text-on-surface-variant hover:text-on-surface`

**B3b — Weight + opacity** (navigation links, category filter tabs): size is locked to avoid layout shift animation.

- **Active:** `font-extrabold text-sm text-on-surface` (full opacity)
- **Inactive:** `font-bold text-sm text-on-surface opacity-50 hover:opacity-80`
- **Note:** Uses `transition-colors` not `transition-all` to prevent animating font-size or layout properties.

**B3c — Weight + opacity (pill)** (tag cloud filters): pill border changes colour; weight shifts; size locked.

- **Active:** `font-extrabold text-sm text-on-surface border-on-surface`
- **Inactive:** `font-medium text-sm text-on-surface-variant border-outline-variant/40 hover:border-outline-variant hover:text-on-surface`

### M3 — Surface fills (MDX components)

Containers that previously used `primary/5` or `secondary/5` tinted fills now use surface tokens. Maintains filled shape but removes colour dependency.

- **Pros panel:** `bg-surface-container-low`
- **Cons panel:** `bg-surface-container`
- **PullQuote:** `bg-surface-container-lowest`
- **Steps circle:** `bg-surface-container-high text-on-surface`
- **Tabs active:** `bg-surface-container-highest text-on-surface font-extrabold`
- **Use for:** Any MDX component that needs a filled container without semantic colour

### S3 — Opacity fade (search modal, footer, 404)

Inactive elements fade to partial opacity; hover brings them toward full opacity.

- **Search inactive rows:** `opacity-50 hover:opacity-75`
- **Footer social icons:** `opacity-30 hover:opacity-100`
- **404/500 button:** `opacity-80 hover:opacity-100`
- **Use for:** List-style UI where one item is active at a time, icon links

---

## 3a. Text Colour: Token vs Opacity Pattern

Two distinct patterns for secondary/muted text — never mix them on the same element type.

### Token pattern — content & cards

Use the `on-surface-variant` colour token directly. Correct for static content where emphasis is structural, not state-driven.

- **When:** Card excerpts, post metadata, body copy secondary text, MDX component descriptions
- **Class:** `text-on-surface-variant`

### Opacity pattern — UI chrome state

Use `text-on-surface` at reduced opacity to signal inactive/deemphasised state in interactive chrome. Correct when the element transitions between active and inactive.

- **When:** Navigation links (inactive), category filter tabs (inactive), icon links
- **Class:** `text-on-surface opacity-50` (inactive), `text-on-surface opacity-80` (hover), `text-on-surface` (active)

**Rule:** If the element has an active/inactive toggle → opacity pattern. If the element is always muted → token pattern.

---

## 4. Typography

The typographic system is a dialogue between two distinct personalities: the friendly UI and the serious content.

### UI & Navigation: Plus Jakarta Sans

This sans-serif is used for all "structural" elements. Its rounded terminals mirror the `xl` corner radius scale.

- Use Tailwind's standard scale only: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, etc. No custom pixel sizes.
- Small-caps labels use `tracking-widest` consistently. No custom tracking values.

### Long-form Content: Newsreader

A highly legible, elegant serif used for the reading experience.

- **Body:** `text-base` (18px in markdown context). Line-height `1.7`.
- **Article headings (h2):** `text-2xl` with a 3px left border in `primary` colour (semantic accent in editorial context).

---

## 4a. Border Radius — Canonical Scale

The radius scale is restricted at the Tailwind level. Only these values generate CSS — using any other will silently produce no output:

| Token          | Value  | Use                                                         |
| -------------- | ------ | ----------------------------------------------------------- |
| `rounded-sm`   | 0.5rem | Inline elements: `<kbd>`, small chips                       |
| `rounded`      | 1rem   | Modal panels, compact containers                            |
| `rounded-lg`   | 2rem   | Media containers (images, video thumbnails), section blocks |
| `rounded-xl`   | 3rem   | Cards (`ds-card`), navigation bar                           |
| `rounded-full` | 9999px | Pills, buttons, avatar circles, tab indicators              |

**Blocked (no CSS generated):** `rounded-xs`, `rounded-md`, `rounded-2xl`, `rounded-3xl`.

**Rule:** Every container must have at least `rounded-sm`. Cards are always `rounded-xl`. If you think you need `rounded-2xl`, use `rounded-xl` instead.

---

## 4b. Opacity — Canonical Scale

Off-scale opacity values are blocked at the Tailwind level. Only these values generate CSS:

**Allowed:** 0, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 100

**Blocked:** 5, 15, 35, 45, 55, 65, 85, 95

Note: Arbitrary colour modifiers (`/8`, `/20`, etc. in `border-outline-variant/50`) use `color-mix()` internally and cannot be restricted — use sparingly and prefer the canonical set where possible.

---

## 4c. Semantic `ds-*` Classes

Semantic utility classes defined via `@layer components` that bundle multiple tokens into a single intent-named class. Always prefer `ds-*` over repeating the token bundle.

| Class         | Expands to                                         | Use                                          |
| ------------- | -------------------------------------------------- | -------------------------------------------- |
| `ds-card`     | `bg-surface-container-lowest rounded-xl shadow-sm` | All card containers                          |
| `ds-metadata` | `font-label text-xs text-on-surface-variant`       | Post date, author, read-time lines           |
| `ds-post-tag` | ghost pill (see Blog Cards)                        | Deprecated — use ghost pill classes directly |

---

## 5. Elevation & Depth

We move away from the "shadow-everything" approach, favoring **Tonal Layering**.

### The Layering Principle

Depth is achieved by "stacking" surface tokens.

- **Level 0 (Base):** `surface` (`#f5f7f9` light / `#1c1f21` dark)
- **Level 1 (Sectioning):** `surface-container-low`
- **Level 2 (Cards):** `surface-container-lowest` (pure white in light / `#161819` in dark)

### Ambient Shadows

Shadows are only used for "elevated" states (e.g., hovering over a card).

- **Specification:** Extra-diffused blur (20px-40px), opacity at 4%-8%.
- **Coloring:** Never use pure grey. Use a tinted version of `on-surface` (`#2c2f31`) to mimic natural light.

### The "Ghost Border" Fallback

If a border is required for accessibility, use the `outline-variant` token at **15% opacity**. 100% opaque borders are strictly forbidden.

---

## 6. Components

### Brand Gradient Animation

Interactive gradient cycling used on hero headings and premium text elements. The gradient animates through the primary, secondary, and tertiary color palette with `gBoost` animation (4s loop). On hover, the gradient responds to mouse movement. Filter adjustments provide visual feedback:

- Default: `saturate(0.6) brightness(0.9)` — subtle, elegant
- Hover: `saturate(1.8) brightness(1.15)` — high-contrast, inviting
- Animation: `blur(12px) saturate(0.6) brightness(0.9)` — smooth transitions

### Navigation Bar

- **Style:** Sticky, floating pill-shape.
- **Visuals:** Uses the Glassmorphism rule (backdrop blur) with an `xl` corner radius.
- **Interaction:** Active links use **B3 pattern** — `font-extrabold text-base text-on-surface`. No background colour change.

### Blog Cards

- **Structure:** Large, `xl` rounded corners. Images have a subtle inner-shadow to feel inset.
- **Background:** `ds-card` (maps to `bg-surface-container-lowest rounded-xl` — white in light mode). Never override with `bg-surface-container`.
- **Hover State:** `scale(1.02)` + `font-extrabold` title. No colour change.
- **Tags:** Ghost pill — `px-2.5 py-0.5 rounded-full border border-outline-variant/50 text-on-surface-variant text-xs font-headline font-semibold`. Tags are neutral labels, not coloured, not filled.

### MDX Components

All MDX components (ProsCons, Steps, Tabs, PullQuote, SeriesNav, TechCard) use surface tokens for fills. See M3 pattern above.

### Interactive Code Blocks

- **Container:** `surface-container-highest` background.
- **Typography:** Monospace at `text-sm` (0.875rem).
- **Detail:** Include a "Copy" action chip in the top right that uses a `tertiary` accent on success.

### Buttons

- **Primary:** `bg-on-surface text-surface` with `rounded-full`. Opacity fade for hover states (`opacity-80 hover:opacity-100`).
- **States:** On press, apply a `4px` vertical "squish" (transform: scaleY(0.96)) to mimic physical feedback.

### Video / Media Play Button Overlay

Play button overlays on video thumbnails use design tokens, not hardcoded colours.

- **Button circle:** `bg-on-surface/90` (adapts to light/dark mode)
- **Play icon:** `text-surface`
- **Overlay tint:** `bg-black/20 hover:bg-black/30`
- **Never use:** `bg-white/90 text-gray-900`

### Theme Toggle

The theme toggle uses animated icon transitions (`themeSweepRight`, `themeSweepLeft`) to guide the eye as the color scheme changes. Icons respond with color shifts and glow effects on hover:

- Sun icon (light mode): Yellow/gold glow (`#fbbf24`)
- Moon icon (dark mode): Blue/slate glow (`#a8c4f0`)

Apply `theme-transitioning` class during theme switch to fade all color properties smoothly across the entire page.

---

## 7. Do's and Don'ts

### Do

- **Use "Breathing Room":** Apply `Spacing-12` or `Spacing-16` between major content sections.
- **Embrace Asymmetry:** It is encouraged to have a 2-column grid where one column is significantly wider (editorial style) rather than a symmetrical 50/50 split.
- **Nest Surfaces:** Put a `surface-container-lowest` card inside a `surface-container-low` section for a premium, layered feel.
- **Use B3/M3/S3 for chrome:** All interactive UI elements that aren't semantic labels must use weight, surface, or opacity shifts — not primary/secondary colour.

### Don't

- **Don't use 1px lines:** Use white space or color shifts to separate content.
- **Don't use pure black:** Use `on-surface` for text and `#1c1f21` for dark mode surface — never `#000000`.
- **Don't use sharp corners:** Every container must have at least `rounded-sm` (0.5rem); cards always `rounded-xl`.
- **Don't use off-scale radius:** `rounded-2xl`, `rounded-3xl`, `rounded-md`, `rounded-xs` are blocked — they produce no CSS.
- **Don't use off-scale opacity:** `opacity-55`, `opacity-85`, etc. are blocked. Use the canonical set (multiples of 10, plus 25/75).
- **Don't mix text colour patterns:** `text-on-surface-variant` for static content; `text-on-surface opacity-X` for interactive chrome state. Never apply both to the same element type.
- **Don't use primary/secondary for chrome:** These colours are reserved for semantic labels and article links only. Navigation, filters, search, footer, TOC — all neutral.
- **Don't use custom px sizes:** All type sizes must map to Tailwind's standard scale. No `text-[10px]`, `text-[0.8rem]`, etc.
- **Don't clutter the UI:** If a decorative element doesn't serve the "Byte Mark" vibe, remove it. Use the `tertiary` (yellow/gold) tokens sparingly for "delight" moments only.
