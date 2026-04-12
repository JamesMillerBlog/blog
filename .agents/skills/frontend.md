# Frontend Skill

Cross-tool skill for Next.js UI development following the Byte Mark design system.

## Stack

- **Framework:** Next.js (App Router, static generation)
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript (strict mode)
- **Content:** MDX

## Next.js Conventions

- App Router — no `pages/` directory
- Server components by default
- Client components marked `'use client'`
- File-based routing under `web/src/app/`

## File Locations

- Components: `web/src/app/_components/`
- Pages: `web/src/app/[page]/page.tsx`
- Global styles: `web/src/app/globals.css`
- Types: `web/src/types/`
- Utilities: `web/src/common/`

## Design System

See `.agents/skills/design.md` for the full Byte Mark spec. Key rules:

- No 1px borders — use color shifts
- `rounded-xl` or larger on cards/containers
- Semantic type scale classes (`.type-display`, `.type-body`, etc.)
- Primary `#00675d`, Secondary `#a02d70`

## Workflow

1. Understand the component or page requirement
2. Check existing patterns in `web/src/app/_components/`
3. Implement with TypeScript types
4. Verify: `cd web && pnpm tsc --noEmit`

## Common Commands

```bash
cd web
pnpm dev          # Development server
pnpm build        # Production build
pnpm test         # Unit tests (vitest)
pnpm tsc --noEmit # Type check only
```
