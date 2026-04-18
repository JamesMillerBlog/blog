# Frontend Skill

## Stack
- Next.js App Router, static generation · Tailwind CSS v4 · TypeScript strict · MDX

## Conventions
- Server components by default · Client components: `'use client'`
- No `pages/` directory · File-based routing under `web/src/app/`

## File Locations
- Components: `web/src/app/_components/`
- Pages: `web/src/app/[page]/page.tsx`
- Styles: `web/src/app/globals.css`
- Types: `web/src/types/`
- Utils: `web/src/common/`

## Verify
```bash
cd web && pnpm tsc --noEmit
```
