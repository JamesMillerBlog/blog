# Blog — Agent Config

Next.js 16+ blog, MDX content, migrated from WordPress. This repo: app code only.

Read extra skill files only when relevant:
- `.agents/skills/design.md` for UI/design work
- `.agents/skills/frontend.md` for Next.js/frontend implementation
- `.agents/skills/infrastructure.md` for Terraform, AWS, CI/CD
- `.agents/skills/security.md` for security review or threat-sensitive changes

## Repos
- **App:** this repo
- **Content:** `../blog-content/` — posts, social, SEO (has own AGENTS.md)

## Structure
- `web/design/DESIGN.md` — Byte Mark design system
- `web/src/app/` — App Router pages and components
- `web/src/app/_components/` — shared components
- `web/_posts/` — local MDX preview
- `.agents/skills/` — on-demand cross-tool skills
- `.claude/agents/` — Claude agents

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

**Reviewer agents** — read-only, dispatched by `/pre-push-review` based on review mode and changed file types:

| Agent | Dispatched when | Checks |
|-------|-----------------|--------|
| `reviewer-security` | always | Secrets, injection, CVEs |
| `reviewer-code-quality` | app / infra changes | Smells, complexity, best practices |
| `reviewer-frontend` | `*.tsx/ts/jsx/js/css` | React, TypeScript, a11y |
| `reviewer-design` | `*.tsx/jsx/css` | Byte Mark tokens, typography |
| `reviewer-infrastructure` | infra / CI / Docker / Terraform changes | GitHub Actions, IAM, Terraform |

## Docker
Claude runs in container via `pnpm claude` (no rebuild) or `pnpm claude:fresh` (rebuild image first). See `docs/DOCKER.md` for security model.

## Other Tools
- **Gemini skills** (`.gemini/skills/`): `infrastructure` · `security-audit` · `design-review`
- **Codex subagents** (`.codex/agents/`): `frontend-dev` · `design-expert` · `infrastructure` · `security-auditor`
