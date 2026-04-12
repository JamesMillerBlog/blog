# jamesmiller.blog

Personal blog and portfolio for [James Miller](https://jamesmiller.blog).

## Stack

- **Next.js 16** (App Router, static generation)
- **MDX** — blog posts as `.mdx` files with frontmatter
- **Tailwind CSS v4** — design system ("Byte Mark")
- **Framer Motion** — animated post grid
- **TypeScript** throughout

## Project Structure

```
├── web/                  # Next.js application
│   ├── _posts/           # MDX blog posts
│   ├── src/app/          # App Router pages and components
│   ├── src/common/       # Utilities and constants
│   └── src/types/        # TypeScript types
├── docs/                 # AI workflow documentation
├── .claude/              # Claude Code config and custom commands
├── AGENTS.md             # AI agent instructions
└── CLAUDE.md             # Claude Code project config
```

## Getting Started

```bash
cd web
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Writing a Post

Add a `.mdx` file to `web/_posts/` with the following frontmatter:

```mdx
---
title: "Your Post Title"
excerpt: "A short description."
coverImage: "/assets/blog/your-post/cover.jpg"
date: "2026-03-22"
tags: ["nextjs", "react"]
---

Your content here.
```

## Commands

```bash
pnpm dev        # Development server
pnpm build      # Production build
pnpm test       # Run unit tests (vitest)
```

## Design System

See `web/design/DESIGN.md` for the full design system spec. Key tokens:

- **Primary:** `#00675d` (teal)
- **Secondary:** `#a02d70` (magenta)
- **Headline font:** Plus Jakarta Sans
- **Body font:** Newsreader
