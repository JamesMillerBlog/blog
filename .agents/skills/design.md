# Design Skill — Byte Mark

Full spec: `web/design/DESIGN.md` · Styles: `web/src/app/globals.css`

## Colors
- Primary: `#00675d` · Secondary: `#a02d70` · Tertiary: yellow (delight only)
- Use CSS custom properties — no hardcoded hex
- Text: `on-surface` (`#2c2f31`) — no pure black

## Typography
- UI: Plus Jakarta Sans (`font-headline`) · Content: Newsreader (`font-body`)

| Class | Usage |
|-------|-------|
| `.type-display` | Hero h1, page titles |
| `.type-section` | Section h2 |
| `.type-card-title` | Card h3 |
| `.type-body-lead` | Intro paragraphs |
| `.type-body` | Prose |
| `.type-label` | Dates, metadata |
| `.type-tag` | Pills, badges |

## Rules
- No 1px borders — color shifts for depth
- `rounded-xl`+ on cards/containers
- `backdrop-blur` for floating/overlay UI

## Pill Buttons
```
px-4 py-1.5 rounded-full text-sm font-headline font-semibold transition-all duration-300 cursor-pointer
inactive: text-on-surface-variant hover:text-primary hover:bg-surface-container-low
active:   bg-secondary-container text-on-secondary-container
```
