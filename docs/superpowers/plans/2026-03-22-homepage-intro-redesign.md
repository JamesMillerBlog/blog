# Homepage Intro Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic hero copy and "More Articles" heading with personal, on-brand content, and add a curated tag config that controls which filter buttons appear.

**Architecture:** Three small, independent changes — hero copy rewrite, section heading + subtitle update, and a new `FEATURED_TAGS` constant wired into `FilteredPostGrid` via a prop. No structural changes to layouts or components.

**Tech Stack:** Next.js 16, React, TypeScript, Tailwind CSS

---

## Files

| File | Action |
|---|---|
| `src/app/_components/hero-section.tsx` | Modify — new copy with teal `<span>` highlights |
| `src/app/_components/filtered-post-grid.tsx` | Modify — new heading/subtitle + `featuredTags` prop |
| `src/common/consts/constants.ts` | Modify — add `FEATURED_TAGS` |
| `src/app/page.tsx` | Modify — pass `featuredTags` prop |

---

## Task 1: Update hero copy

**Files:**
- Modify: `src/app/_components/hero-section.tsx`

- [ ] **Step 1: Open the file and locate the badge, h1, and p elements**

  The badge is around line 8, h1 around line 13, p around line 21.

- [ ] **Step 2: Replace the badge text**

  Change the badge content from `HELLO, WORLD` — it stays but the inner text should just remain as-is (no change needed here, badge is kept).

- [ ] **Step 3: Replace the h1**

  Replace:
  ```tsx
  <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-on-surface mb-8">
    Crafting{" "}
    <span className="text-primary italic font-body font-normal">
      digital magic
    </span>{" "}
    through code and whimsy.
  </h1>
  ```
  With:
  ```tsx
  <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-on-surface mb-8">
    I&apos;m{" "}
    <span className="text-primary">James Miller.</span>
  </h1>
  ```

- [ ] **Step 4: Replace the subtitle paragraph**

  Replace:
  ```tsx
  <p className="font-body text-xl md:text-2xl text-on-surface-variant max-w-xl leading-relaxed">
    A technical diary of a designer-turned-engineer exploring WebXR, the
    Metaverse, and the future of open software.
  </p>
  ```
  With:
  ```tsx
  <p className="font-body text-xl md:text-2xl text-on-surface-variant max-w-xl leading-relaxed">
    This blog is a space for{" "}
    <span className="text-primary font-bold">creative</span> exploration of{" "}
    <span className="text-primary font-bold">technology</span> — ideas,
    experiments, and thinking on how to{" "}
    <span className="text-primary font-bold">solve problems</span>, then{" "}
    <span className="text-primary font-bold">ship</span>{" "}
    <span className="text-primary font-bold">products</span> and{" "}
    <span className="text-primary font-bold">build</span>{" "}
    <span className="text-primary font-bold">experiences</span>.
  </p>
  ```

- [ ] **Step 5: Verify visually**

  Run `pnpm dev` in `web/`, open http://localhost:3000. Confirm:
  - Badge still shows `✦ HELLO, WORLD`
  - Headline reads `I'm James Miller.` with only "James Miller" in teal
  - Body text has teal bold highlights on: creative, technology, solve problems, ship, products, build, experiences
  - Right-hand image column and status card are unchanged

- [ ] **Step 6: Commit**

  ```bash
  git add src/app/_components/hero-section.tsx
  git commit -m "feat: replace hero copy with personal intro"
  ```

---

## Task 2: Update section heading in FilteredPostGrid

**Files:**
- Modify: `src/app/_components/filtered-post-grid.tsx`

- [ ] **Step 1: Replace the h2 and add a subtitle**

  Find (around line 27–29):
  ```tsx
  <h2 className="font-headline text-3xl font-extrabold text-on-surface">
    More Articles
  </h2>
  ```
  Replace with:
  ```tsx
  <div>
    <h2 className="font-headline text-3xl font-extrabold text-on-surface">
      Explore Topics
    </h2>
    <p className="font-body text-sm text-on-surface-variant mt-1">
      Filter by what you&apos;re curious about
    </p>
  </div>
  ```

- [ ] **Step 2: Verify visually**

  Open http://localhost:3000, scroll to the post grid section. Confirm:
  - Heading reads "Explore Topics" (no colour highlight)
  - Subtitle "Filter by what you're curious about" appears below in muted text
  - Tag pills still appear to the right
  - Filtering still works

- [ ] **Step 3: Commit**

  ```bash
  git add src/app/_components/filtered-post-grid.tsx
  git commit -m "feat: replace More Articles heading with Explore Topics"
  ```

---

## Task 3: Add FEATURED_TAGS config and wire it up

**Files:**
- Modify: `src/common/consts/constants.ts`
- Modify: `src/app/_components/filtered-post-grid.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add FEATURED_TAGS to constants.ts**

  Append to `src/common/consts/constants.ts`:
  ```ts
  export const FEATURED_TAGS = ["AWS", "WebXR", "Serverless", "React", "AI"];
  ```

- [ ] **Step 2: Update FilteredPostGrid to accept featuredTags prop**

  Change the component signature from:
  ```tsx
  export function FilteredPostGrid({ posts }: { posts: Post[] }) {
  ```
  To:
  ```tsx
  export function FilteredPostGrid({
    posts,
    featuredTags,
  }: {
    posts: Post[];
    featuredTags?: string[];
  }) {
  ```

- [ ] **Step 3: Use featuredTags when building the tag list**

  Replace the `tags` useMemo (around line 13–17):
  ```tsx
  const tags = useMemo(() => {
    const allTags = posts.flatMap((post) => post.tags || []);
    const uniqueTags = Array.from(new Set(allTags)).filter(Boolean);
    return ["All", ...uniqueTags.sort()];
  }, [posts]);
  ```
  With:
  ```tsx
  const tags = useMemo(() => {
    if (featuredTags && featuredTags.length > 0) {
      return ["All", ...featuredTags];
    }
    const allTags = posts.flatMap((post) => post.tags || []);
    const uniqueTags = Array.from(new Set(allTags)).filter(Boolean);
    return ["All", ...uniqueTags.sort()];
  }, [posts, featuredTags]);
  ```

- [ ] **Step 4: Pass FEATURED_TAGS from page.tsx**

  In `src/app/page.tsx`, add the import:
  ```tsx
  import { FEATURED_TAGS } from "@/common/consts/constants";
  ```
  Then update the `FilteredPostGrid` usage:
  ```tsx
  <FilteredPostGrid posts={morePosts} featuredTags={FEATURED_TAGS} />
  ```

- [ ] **Step 5: Verify**

  Open http://localhost:3000, scroll to the post grid. Confirm:
  - Only "All", "AWS", "WebXR", "Serverless", "React", "AI" appear as filter buttons
  - Selecting a tag still filters posts correctly
  - Posts that have tags not in FEATURED_TAGS still appear under "All"

- [ ] **Step 6: Run tests**

  ```bash
  cd web && pnpm test
  ```
  Expected: all 45 tests pass.

- [ ] **Step 7: Commit**

  ```bash
  git add src/common/consts/constants.ts src/app/_components/filtered-post-grid.tsx src/app/page.tsx
  git commit -m "feat: add FEATURED_TAGS config and wire into FilteredPostGrid"
  ```
