# James Miller's Blog - AI Agent Configuration

This file is automatically read by Claude Code on startup.

## Project Overview

A Next.js 16+ blog with MDX content, migrated from WordPress. Full AI-first workflow for content creation, development, and marketing.

## Design System

See `DESIGN.md` for the complete design system ("The Whimsical Scholar"):
- **Primary color:** `#00675d` (teal)
- **Secondary color:** `#a02d70` (magenta)
- **Typography:** Plus Jakarta Sans (UI), Newsreader (content)
- **Style:** No 1px borders, use color shifts for depth, `xl` rounded corners

## Project Structure

```
├── AGENTS.md            # This file (Claude reads on startup)
├── DESIGN.md            # Design system
├── docs/                # AI workflow documentation
├── .claude/
│   ├── commands/        # Custom slash commands
│   └── settings.json    # MCP + hooks configuration
└── web/                 # Next.js application
    ├── _posts/          # MDX blog posts (56 posts)
    ├── src/app/         # Next.js App Router pages + components
    ├── src/common/      # Utilities (api.ts, mdx.ts) and constants
    ├── src/types/       # TypeScript types
    ├── package.json     # Dependencies
    └── ...
```

## Quick Commands

```bash
/new-post [topic]   # Create a new blog post
/social [slug]      # Generate social media content
/ideas              # Brainstorm post ideas
/review [slug]      # Review and improve a post
```

## Key Commands

```bash
cd web && pnpm dev      # Development server
cd web && pnpm build    # Production build
cd web && pnpm test     # Run unit tests (vitest)
```

## UI Conventions

### Pill buttons
All interactive pill buttons (nav, tag filters, project filters) share one pattern:
```
px-4 py-1.5 rounded-full text-sm font-headline font-semibold transition-all duration-300 cursor-pointer
inactive: text-on-surface-variant hover:text-primary hover:bg-surface-container-low
active:   bg-secondary-container text-on-secondary-container
```

### Semantic type scale
`globals.css` defines utility classes to use instead of composing font/size/color ad-hoc:
- `.type-display` — hero h1, page titles
- `.type-section` — section h2 headings
- `.type-card-title` — card h3 headings
- `.type-body-lead` — intro/lede paragraphs
- `.type-body` — regular prose
- `.type-label` — dates, metadata
- `.type-tag` — pill/badge labels

## Writing Style

- Technical but accessible
- First person, conversational
- Include practical code examples
- Topics: WebXR, Serverless, AWS, React Three Fiber, DevOps

## Author

- Name: James Miller
- Site: https://jamesmiller.blog
- Twitter: @JamesMillerBlog
