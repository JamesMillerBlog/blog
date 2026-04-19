# Blog — Agent Config

Next.js 16+ blog, MDX content, migrated from WordPress. This repo: app code only.

## Repos
- **App:** this repo
- **Content:** `../blog-content/` — posts, social, SEO (has own AGENTS.md)

## Structure
```
web/
├── design/DESIGN.md       # Byte Mark design system (full spec)
├── src/app/               # App Router pages + components
├── src/app/_components/   # Shared components
└── _posts/                # MDX (local preview)
.agents/skills/            # Cross-tool skills
.claude/agents/            # Claude agents
```

## Commands
```bash
cd web && pnpm dev      # dev server
cd web && pnpm build    # production build
cd web && pnpm test     # unit tests (vitest)
```

## Design System — Byte Mark
Full spec: `web/design/DESIGN.md`. Key tokens:
- Primary: `#00675d` · Secondary: `#a02d70`
- UI: Plus Jakarta Sans · Content: Newsreader
- No 1px borders · `rounded-xl`+ · color shifts for depth

## Claude Agents

**Writer agents** — implement and build:

| Agent | Role |
|-------|------|
| `frontend-dev` | UI components, pages, styling |
| `design-expert` | Byte Mark compliance |
| `infrastructure` | Terraform & AWS |
| `security-auditor` | Vulnerability scanning |
| `parallel-executor` | Independent parallel tasks |

**Reviewer agents** — read-only, auto-dispatched by `/pre-push-review`:

| Agent | Checks |
|-------|--------|
| `reviewer-security` | Secrets, injection, CVEs |
| `reviewer-frontend` | React, TypeScript, a11y |
| `reviewer-design` | Byte Mark tokens, typography |
| `reviewer-infrastructure` | GitHub Actions, IAM, Terraform |
| `reviewer-code-quality` | Smells, complexity, best practices |

## Docker
Claude runs in container via `pnpm claude` (no rebuild) or `pnpm claude:fresh` (rebuild image first). See `docs/DOCKER.md` for security model.

## Other Tools
- **Gemini skills** (`.gemini/skills/`): `infrastructure` · `security-audit` · `design-review`
- **Codex subagents** (`.codex/agents/`): `frontend-dev` · `design-expert` · `infrastructure` · `security-auditor`
