# jamesmiller.blog

Personal blog and portfolio for [James Miller](https://jamesmiller.blog).

## Stack

- **Next.js 16** (App Router, static generation)
- **MDX** — blog posts stored in a separate content repo and synced to S3
- **Tailwind CSS v4** — design system ("Byte Mark")
- **Framer Motion** — animated post grid
- **TypeScript** throughout

## Project Structure

```
├── web/                  # Next.js application
│   ├── _posts/           # Ignored local dev cache for pulled MDX posts
│   ├── src/app/          # App Router pages and components
│   ├── src/common/       # Utilities and constants
│   └── src/types/        # TypeScript types
├── infrastructure/       # Terraform modules, vars, and stacks
├── scripts/              # Asset and local content helper scripts
├── docs/                 # AI workflow documentation
├── .claude/              # Claude Code config and custom commands
├── AGENTS.md             # AI agent instructions
└── CLAUDE.md             # Claude Code project config
```

## Getting Started

### Prerequisites

- [pnpm](https://pnpm.io/installation)
- [direnv](https://direnv.net) — auto-loads environment variables per project
- [Terraform](https://developer.hashicorp.com/terraform/install) — if working on infrastructure

```bash
brew install direnv pnpm terraform terramate
```

Add direnv to your shell (add to `~/.zshrc` then restart your terminal):

```bash
echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc
```

### First-time setup

```bash
# 1. Copy and fill in environment variables (API tokens, state bucket name)
cp .envrc.example .envrc
# edit .envrc with your values, then:
direnv allow

# 2. Copy and fill in Terraform backend config (S3 bucket for remote state)
cp infrastructure/vars/backend.hcl.example infrastructure/vars/backend.hcl
# edit backend.hcl with your values

# 3. Install Node dependencies
cd web && pnpm install
```

### Running locally

```bash
cd web && pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Content Workflow

Blog posts now live in the separate `blog-content` repo and are published to the shared posts bucket.

For local development in this repo, pull them into `web/_posts`:

```bash
export POSTS_S3_BUCKET="<your-posts-bucket-name>"
./scripts/pull-posts.sh ./web/_posts
```

New posts in the content repo still use frontmatter like:

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

See [`docs/AWS_INFRASTRUCTURE.md`](docs/AWS_INFRASTRUCTURE.md) for the app/infra/content split.

## Assets

Shared assets are uploaded to the assets bucket/CDN created by Terraform.

Useful scripts:

```bash
./scripts/upload-assets.sh <local-directory> [r2-prefix]
./scripts/list-assets.sh [r2-prefix]
./scripts/purge-assets.sh [path-pattern]
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
