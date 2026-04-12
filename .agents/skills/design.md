# Design Skill — Byte Mark Design System

Cross-tool skill for implementing and reviewing UI against the Byte Mark design system.

## Colors

- **Primary:** `#00675d` (teal)
- **Secondary:** `#a02d70` (magenta)
- Use CSS custom properties / design tokens — no hardcoded values
- Tertiary: Yellow/gold for delight moments only

## Typography

- **UI Font:** Plus Jakarta Sans (`font-headline`)
- **Content Font:** Newsreader (`font-body`)

### Semantic Type Scale

| Class | Usage |
|-------|-------|
| `.type-display` | Hero h1, page titles |
| `.type-section` | Section h2 headings |
| `.type-card-title` | Card h3 headings |
| `.type-body-lead` | Intro/lede paragraphs |
| `.type-body` | Regular prose |
| `.type-label` | Dates, metadata |
| `.type-tag` | Pill/badge labels |

## Component Rules

- **No 1px borders** — use color shifts for depth instead
- **No sharp corners** — cards and containers use `rounded-xl` or larger
- **No pure black** — use `on-surface` (`#2c2f31`) for text
- **Glassmorphism** — `backdrop-blur` for floating/overlay UI

### Pill Buttons

```
px-4 py-1.5 rounded-full text-sm font-headline font-semibold transition-all duration-300 cursor-pointer
inactive: text-on-surface-variant hover:text-primary hover:bg-surface-container-low
active:   bg-secondary-container text-on-secondary-container
```

## File Locations

- Full spec: `web/design/DESIGN.md`
- Global styles: `web/src/app/globals.css`
- Components: `web/src/app/_components/`

## Verification Checklist

- [ ] Colors use design tokens (not hardcoded hex)
- [ ] Typography uses semantic type scale classes
- [ ] Rounded corners are `xl` or more
- [ ] No `border` with `1px solid`
- [ ] Hover states defined for interactive elements
- [ ] Responsive behaviour correct
