# Frontend Skill

## Stack
- Next.js App Router, static generation · Tailwind CSS v4 · TypeScript strict · MDX

## Conventions
- Server components by default · Client components: `'use client'`
- No `pages/` directory · File-based routing under `web/src/app/`

## File Locations
- Shared components: `web/src/app/_components/`
- Post components: `web/src/app/posts/_components/` (author-bio, back-button, related-posts, table-of-contents)
- MDX components: `web/src/components/mdx/`
- UI components: `web/src/components/ui/`
- Pages: `web/src/app/[page]/page.tsx`
- Styles: `web/src/app/globals.css`
- Types: `web/src/types/`
- Utils: `web/src/common/`

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

## Verify
```bash
cd web && pnpm tsc --noEmit
```
