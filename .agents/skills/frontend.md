# Frontend Skill

## Stack
- Next.js App Router, static generation · Tailwind CSS v4 · TypeScript strict · MDX

## Conventions
- Server components by default · Client components: `'use client'`
- No `pages/` directory · File-based routing under `web/src/app/`

## File Locations
- Components: `web/src/app/_components/` (shared) and `web/src/components/mdx/` (MDX only)
- Pages: `web/src/app/[page]/page.tsx`
- Styles: `web/src/app/globals.css`
- Types: `web/src/types/`
- Utils: `web/src/common/`

## MDX Components

Available in post content via `web/src/components/mdx/`:
- `<Callout type="info|tip|warning|note">` — highlighted callout boxes
- `<ImageCaption src="" alt="" caption="">` — figures with captions
- `<Steps><Step>` — numbered step lists

All exported from `web/src/components/mdx/index.ts`.

## Verify
```bash
cd web && pnpm tsc --noEmit
```
