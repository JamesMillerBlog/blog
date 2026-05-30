# Frontend Skill

## Stack
- Next.js App Router, static generation · Tailwind CSS v4 · TypeScript strict · MDX

## Conventions
- Server components by default · Client components: `'use client'`
- No `pages/` directory · File-based routing under `web/src/app/`
- **Formatting:** single quotes, no semicolons, trailing commas (ES5), 100 print width per `.prettierrc`. 2-space indent (spaces, not tabs). Preserve surrounding formatting when editing.

## File Locations
- Shared components: `web/src/app/_components/`
- Post components: `web/src/app/posts/_components/` (author-bio, back-button, related-posts, table-of-contents)
- MDX components: `web/src/components/mdx/`
- UI components: `web/src/components/ui/`
- Pages: `web/src/app/[page]/page.tsx`
- Styles: `web/src/app/globals.css`
- Types: `web/src/types/`
- Utils: `web/src/common/`
- Tests: `web/src/**/*.test.{ts,tsx}` (vitest + jsdom + testing-library)
- A11y tests: `web/e2e/a11y.spec.ts` (Playwright + @axe-core)
- Vitest setup: `web/vitest.setup.ts` (matchMedia stub, jest-dom matchers)

## MDX Components

Available in post content via `web/src/components/mdx/`:

**Content & Formatting:**
- `<Callout type="info|tip|warning|note">` — highlighted callout boxes
- `<ImageCaption src="" alt="" caption="">` — figures with captions
- `<Steps><Step>` — numbered step lists
- `<PullQuote>` — emphasized quotes
- `<Kbd>` — keyboard key styling

**Media & Interactive:**
- `<YouTubeEmbed videoId="">` — embedded videos
- `<Screenshot src="" alt="">` — styled screenshots
- `<SplitMedia>` — side-by-side content/media layout

**Reference & Documentation:**
- `<FileTree>` — directory structure visualization
- `<SeriesNav>` — post series navigation
- `<Tabs><Tab label="">` — tabbed content groups
- `<CodeBlock>` — code with line numbers

**Cards & Grids:**
- `<TechCard title="" icon="">` — technology showcase cards
- `<ExampleGrid><ExampleCard>` — grid layout for examples

**Analysis:**
- `<ProsCons pros={[]} cons={[]} />` — advantages/disadvantages comparison

All exported from `web/src/components/mdx/index.ts`.

## Testing
- **Unit tests:** vitest with jsdom env, testing-library/react + jest-dom matchers
- **Setup:** `web/vitest.setup.ts` — imports jest-dom matchers, stubs `window.matchMedia`
- **Coverage requirement:** Every changed `.ts`/`.tsx` source file must have ≥80% line coverage. vitest global thresholds: 40% lines, 40% functions, 30% branches, 40% statements. PR CI enforces per-file 80% gate on changed files.
- **Coverage:** `pnpm test:coverage` (includes `src/**/*.{ts,tsx}`, excludes types/test/fixtures)
- **A11y:** Playwright + @axe-core in `web/e2e/a11y.spec.ts` — runs on WCAG 2.0 AA / 2.1 AA

## Verify
```bash
cd web && pnpm tsc --noEmit   # type check only
cd web && pnpm test           # unit tests (vitest)
cd web && pnpm test:e2e       # Playwright a11y tests
```
