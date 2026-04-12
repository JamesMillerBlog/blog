# James Miller's Blog - AI Agent Configuration

This file is read by all AI tools on startup — it is the shared source of truth for project context.

## Project Overview

A Next.js 16+ blog with MDX content, migrated from WordPress. This repository handles **frontend development** and **application code**.

## Content Repository

Content (blog posts) lives in a separate repository: `../blog-content/`

For content-related tasks (writing posts, social media, SEO, ideation), work in the blog-content repo which has its own AGENTS.md with all content agents and skills.

## Design System

See `web/design/DESIGN.md` for the complete design system ("Byte Mark"):

- **Primary color:** `#00675d` (teal)
- **Secondary color:** `#a02d70` (magenta)
- **Typography:** Plus Jakarta Sans (UI), Newsreader (content)
- **Style:** No 1px borders, use color shifts for depth, `xl` rounded corners

## Project Structure

```
├── AGENTS.md            # This file
├── docs/                # Workflow documentation (see AGENTIC_WORKFLOW.md)
├── .opencode/          # OpenCode config
├── .claude/            # Claude Code config + agents
├── .gemini/           # Gemini CLI config + skills
├── .codex/            # Codex CLI config + agents
├── .agents/skills/    # Cross-tool skills
└── web/               # Next.js application
    ├── design/         # Design system
    ├── _posts/         # MDX blog posts (local preview)
    ├── src/app/        # App Router pages + components
    └── ...
```

## Claude Agents (`.claude/agents/`)

Use `/agent <name>` to switch:

### Writer agents — implement and build

| Agent               | Purpose                  | Best For                   |
| ------------------- | ------------------------ | -------------------------- |
| `frontend-dev`      | General UI development   | Components, pages, styling |
| `design-expert`     | Design system compliance | Ensuring design rules      |
| `infrastructure`    | Terraform & AWS          | Infrastructure as code     |
| `security-auditor`  | Security review          | Vulnerability scanning     |
| `parallel-executor` | Parallel task execution  | Multiple independent tasks |

### Reviewer agents — adversarial, read-only

These agents never write code. They review diffs and flag issues. Dispatched automatically by `/pre-push-review`.

| Agent                     | Purpose            | Checks                                      |
| ------------------------- | ------------------ | ------------------------------------------- |
| `reviewer-security`       | Security audit     | Secrets, injection, CVEs, exploitable logic |
| `reviewer-frontend`       | Frontend audit     | React patterns, TypeScript, accessibility   |
| `reviewer-design`         | Design audit       | Byte Mark compliance, tokens, typography    |
| `reviewer-infrastructure` | Infra audit        | GitHub Actions, IAM, Terraform misconfigs   |
| `reviewer-code-quality`   | Code quality audit | Syntax, smells, complexity, best practices  |

## Gemini Skills (`.gemini/skills/`)

Skills are activated with `activate_skill`:

| Skill            | Purpose                       |
| ---------------- | ----------------------------- |
| `infrastructure` | Terraform & AWS               |
| `security-audit` | Security vulnerability review |
| `design-review`  | Design system compliance      |

## Codex Subagents (`.codex/agents/`)

Available as subagents:

| Subagent           | Purpose                      |
| ------------------ | ---------------------------- |
| `frontend-dev`     | UI components, Next.js pages |
| `design-expert`    | Design system compliance     |
| `infrastructure`   | Terraform & AWS              |
| `security-auditor` | Security review              |

## Key Commands

```bash
cd web && pnpm dev      # Development server
cd web && pnpm build    # Production build
cd web && pnpm test     # Run unit tests (vitest)
```

## UI Conventions

### Pill buttons

```
px-4 py-1.5 rounded-full text-sm font-headline font-semibold transition-all duration-300 cursor-pointer
inactive: text-on-surface-variant hover:text-primary hover:bg-surface-container-low
active:   bg-secondary-container text-on-secondary-container
```

### Semantic type scale

- `.type-display` — hero h1, page titles
- `.type-section` — section h2 headings
- `.type-card-title` — card h3 headings
- `.type-body-lead` — intro paragraphs
- `.type-body` — regular prose
- `.type-label` — dates, metadata
- `.type-tag` — pill/badge labels

## Author

- Name: James Miller
- Site: https://jamesmiller.blog
- Twitter: @JamesMillerBlog
