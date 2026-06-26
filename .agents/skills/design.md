# Design Skill — Byte Mark

Full spec: `web/design/DESIGN.md` · Styles: `web/src/app/globals.css`

## Palette Primitives (Tier 1)

Three source hues — all semantic tokens derive from these:
- `--palette-teal: #00675d` (primary)
- `--palette-rose: #a02d70` (secondary)
- `--palette-amber: #755600` (tertiary — delight only, use sparingly)

## Colors

- Use CSS custom properties — no hardcoded hex
- Text: `on-surface` (`#2c2f31`) — no pure black
- Primary/secondary reserved for semantic labels and article links only — never chrome

## Typography

- UI: Plus Jakarta Sans (`font-headline`) · Content: Newsreader (`font-body`)

Only these semantic type classes exist as CSS utilities:

| Class | Usage |
|-------|-------|
| `.type-body` | Prose paragraphs, content text |
| `.type-label` | Metadata, dates, captions |
| `.type-tag` | Pills/tag labels, badges |

For other headings use Tailwind scales directly (e.g. `text-2xl font-headline font-bold`).

## Rules

- No 1px borders — color shifts for depth
- `rounded-xl`+ on cards/containers · `rounded-lg` (1.5rem) on media/images
- `backdrop-blur` for floating/overlay UI

## Text Colour Pattern

Two patterns — never mix on same element type:
- **Token** (`text-on-surface-variant`): static content, card excerpts, metadata
- **Opacity** (`text-on-surface opacity-50`): interactive chrome with active/inactive states (nav, filter tabs)

## B3 Chrome Patterns (no primary/secondary colour)

**B3a — weight + size** (TOC, pagination): `font-extrabold text-base` active / `font-medium text-sm text-on-surface-variant` inactive

**B3b — weight + opacity** (nav links, category tabs): lock size, use `transition-colors` not `transition-all`
- Active: `font-extrabold text-sm text-on-surface`
- Inactive: `font-bold text-sm text-on-surface opacity-50 hover:opacity-80`

**B3c — ghost pill** (tag cloud filters): border-only, no background fills
```
px-2.5 py-0.5 rounded-full border text-sm font-headline font-semibold transition-colors cursor-pointer
inactive: text-on-surface-variant border-outline-variant/40 hover:border-outline-variant hover:text-on-surface
active:   text-on-surface border-on-surface font-extrabold
```
