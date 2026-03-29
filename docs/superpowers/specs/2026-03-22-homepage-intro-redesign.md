# Homepage Intro Redesign

**Date:** 2026-03-22
**Status:** Approved

## Problem

The current hero section headline ("Crafting digital magic through code and whimsy") feels generic and doesn't represent the author. The "More Articles" section heading is bland and misses an opportunity to communicate the filtering intent. Tags displayed in the filter are auto-generated from all post tags with no editorial control.

## Changes

### 1. Hero Section (`hero-section.tsx`)

Replace the existing headline, badge, and subtitle with:

- **Badge:** `✦ HELLO, WORLD` (magenta pill, unchanged style)
- **Headline:** `I'm James Miller.` — "I'm" plain, "James Miller" in primary teal
- **Body:** `This blog is a space for **creative** exploration of **technology** — ideas, experiments, and thinking on how to **solve problems**, then **ship** **products** and **build** **experiences**.`

Highlighted words (primary teal, font-bold): `creative`, `technology`, `solve problems`, `ship`, `products`, `build`, `experiences`.

The decorative right-hand image column and status card remain unchanged.

### 2. Section Heading (`filtered-post-grid.tsx`)

Replace `<h2>More Articles</h2>` with:

- **Heading:** `Explore Topics` — no colour highlight, same font-headline style
- **Subtitle:** `Filter by what you're curious about` — small, muted, sits below the heading

Layout remains: heading+subtitle on the left, tag pills on the right.

### 3. Featured Tags Config (`constants.ts` + `filtered-post-grid.tsx`)

Add to `constants.ts`:

```ts
export const FEATURED_TAGS = ["AWS", "WebXR", "Serverless", "React", "AI"];
```

Update `FilteredPostGrid` to accept an optional `featuredTags?: string[]` prop. When provided, only those tags are shown as filter buttons (plus "All"). When omitted, falls back to current behaviour (all unique tags from posts).

In `page.tsx`, pass `featuredTags={FEATURED_TAGS}` to `FilteredPostGrid`.

## Files to Change

| File | Change |
|---|---|
| `src/app/_components/hero-section.tsx` | New copy with teal highlights |
| `src/app/_components/filtered-post-grid.tsx` | New section heading + `featuredTags` prop |
| `src/common/consts/constants.ts` | Add `FEATURED_TAGS` |
| `src/app/page.tsx` | Pass `featuredTags` prop |

## Out of Scope

- Layout/structural changes to the hero (two-column layout unchanged)
- Changes to post card design
- Changes to the featured posts section above
