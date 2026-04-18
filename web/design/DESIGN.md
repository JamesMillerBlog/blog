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

- **Primary (`#00675d`) & Secondary (`#a02d70`):** These are your "action" engines. Use them for CTAs, active states, and focus indicators.
- **Surface Tiers:** We use the `surface-container` scale to create architectural depth.
- **The "No-Line" Rule:** 1px solid borders are strictly prohibited for sectioning. Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section should sit on a `surface` background to create a "pocket" of content.

### The "Glass & Gradient" Rule

To elevate the experience from "web app" to "digital editorial," use **Glassmorphism** for floating UI like the sticky navigation. Apply a semi-transparent `surface` color with a `backdrop-blur: 12px`.

**Signature Texture:** Use a subtle linear gradient from `primary` to `primary-container` on high-impact elements like the "Subscribe" button or featured article badges to provide a sense of volume and "visual soul."

---

## 3. Typography

The typographic system is a dialogue between two distinct personalities: the friendly UI and the serious content.

### UI & Navigation: Plus Jakarta Sans

This sans-serif is used for all "structural" elements. Its rounded terminals mirror the `xl` corner radius scale.

- **Display-LG (`3.5rem`):** Reserved for hero titles and high-impact headers.
- **Label-MD (`0.75rem`):** Used for metadata, tags, and micro-copy.

### Long-form Content: Newsreader

A highly legible, elegant serif used for the reading experience. It provides the "Scholar" half of our North Star.

- **Body-LG (`1rem`):** The default for article text. Use a generous line-height (`1.7`) to ensure readability.
- **Title-LG (`1.375rem`):** Used for sub-headings within articles to provide a rhythmic break in the text.

---

## 4. Elevation & Depth

We move away from the "shadow-everything" approach, favoring **Tonal Layering**.

### The Layering Principle

Depth is achieved by "stacking" surface tokens.

- **Level 0 (Base):** `surface` (`#f5f7f9`)
- **Level 1 (Sectioning):** `surface-container-low`
- **Level 2 (Cards):** `surface-container-lowest` (pure white)

### Ambient Shadows

Shadows are only used for "elevated" states (e.g., hovering over a card).

- **Specification:** Extra-diffused blur (20px-40px), opacity at 4%-8%.
- **Coloring:** Never use pure grey. Use a tinted version of `on-surface` (`#2c2f31`) to mimic natural light.

### The "Ghost Border" Fallback

If a border is required for accessibility, use the `outline-variant` token at **15% opacity**. 100% opaque borders are strictly forbidden.

---

## 5. Components

### Navigation Bar

- **Style:** Sticky, floating pill-shape.
- **Visuals:** Uses the Glassmorphism rule (backdrop blur) with an `xl` corner radius.
- **Interaction:** Active links should use a `secondary-container` background with `on-secondary-container` text, creating a soft, highlighted "lozenge" effect.

### Blog Cards

- **Structure:** Large, `xl` rounded corners. Images should have a subtle `inner-shadow` to feel inset.
- **Hover State:** Instead of a shadow, use a slight `scale(1.02)` and transition the background from `surface-container-lowest` to `surface-bright`.
- **Spacing:** No dividers. Use `Spacing-8` (`2.75rem`) to separate cards.

### Interactive Code Blocks

- **Container:** `surface-container-highest` background.
- **Typography:** Monospace (standard system mono) at `0.875rem`.
- **Detail:** Include a "Copy" action chip in the top right that uses a `tertiary` accent on success.

### Buttons

- **Primary:** `primary` background, `on-primary` text. `full` roundedness.
- **Secondary:** `surface-container-high` background. No border.
- **States:** On press, apply a `4px` vertical "squish" (transform: scaleY(0.96)) to mimic physical feedback.

---

## 6. Do's and Don'ts

### Do

- **Use "Breathing Room":** Apply `Spacing-12` or `Spacing-16` between major content sections.
- **Embrace Asymmetry:** It is encouraged to have a 2-column grid where one column is significantly wider (editorial style) rather than a symmetrical 50/50 split.
- **Nest Surfaces:** Put a `surface-container-lowest` card inside a `surface-container-low` section for a premium, layered feel.

### Don't

- **Don't use 1px lines:** Use white space or color shifts to separate content.
- **Don't use pure black:** Use `on-surface` for text to maintain the "soft" approachable aesthetic.
- **Don't use sharp corners:** Every container must have at least a `sm` (`0.5rem`) radius; cards should always be `lg` or `xl`.
- # **Don't clutter the UI:** If a decorative element doesn't serve the "Byte Mark" vibe, remove it. Use the `tertiary` (yellow/gold) tokens sparingly for "delight" moments only.
- **Don't clutter the UI:** If a decorative element doesn't serve the "Byte Mark" vibe, remove it. Use the `tertiary` (yellow/gold) tokens sparingly for "delight" moments only.
