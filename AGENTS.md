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
- `.claude/agents/` — Claude Code agents

## AI Tools

| Tool | Config | When to Use |
|------|--------|-------------|
| **Claude Code** (`pnpm claude`) | `.claude/` | Primary — uses Claude Pro subscription |
| **pi** (`pnpm pi`) | `.pi/` | Fallback — OpenCode, Gemini, Codex, DeepSeek models |

### Claude Code
Primary AI harness. Uses your Claude Pro subscription via OAuth. Run in Docker:
```bash
pnpm claude                          # interactive
pnpm claude:fresh                    # rebuild image then interactive
```

### pi
Fallback AI harness for when Claude usage runs out. Supports multiple model providers:
- **OpenCode Go** (DeepSeek V4 Flash/Pro, Kimi, MiniMax, GLM) — default
- **Google Gemini** — set `GEMINI_API_KEY` in `.envrc`
- **OpenAI Codex** — requires ChatGPT Plus/Pro subscription (`/login openai`)
- **DeepSeek** — set `DEEPSEEK_API_KEY` in `.envrc`
- **OpenRouter** — set `OPENROUTER_API_KEY` in `.envrc`

```bash
pnpm pi                              # interactive (default: opencode-go/deepseek-v4-flash)
pnpm pi:fresh                        # rebuild image then interactive
pi --model google                    # switch to Gemini from CLI
pi --model opencode-go/deepseek-v4-pro  # switch model inline
```

Inside pi, use `/model` or Ctrl+L to switch providers at any time.

## Design System — Byte Mark
Full spec: `web/design/DESIGN.md`. Key tokens:
- Primary: `#00675d` · Secondary: `#a02d70`
- UI: Plus Jakarta Sans · Content: Newsreader
- No 1px borders · `rounded-xl`+ · color shifts for depth

## Automated Workflows

GitHub Actions automatically implement issues and review PRs using pi agents:

| Workflow | Trigger | Action |
|----------|---------|--------|
| **AI Issue Implementation** | Label `ai` added to issue | Creates branch, implements via pi, opens PR |
| **AI PR Review** | PR opened / updated | Reviews diff via pi, posts findings as comment |

These workflows run `pi` with prompt guards against injection attacks. See `.github/workflows/` for details.

## Pre-Push Review System

Local pre-push review via `bash scripts/pre-push-iterate.sh`:
- Reads `.claude/prompts/pre-push-review.md` or `.pi/prompts/pre-push-review.md`
- **Iterative loop:** Review → Fix CRITICAL/HIGH → Retest → Repeat (max 10 passes)
- Exits clean only when verdict is **SAFE TO PUSH**
- Writes findings to `.pre-push-review/findings.md` and verdict to `.pre-push-review/verdict`

Triggered automatically by `.husky/pre-push` hook. Falls back: claude → pi.

## Claude Agents

**Writer agents** — implement and build:

| Agent | Role |
|-------|------|
| `frontend-dev` | UI components, pages, styling |
| `design-expert` | Byte Mark compliance |
| `infrastructure` | Terraform & AWS |
| `security-auditor` | Vulnerability scanning |
| `parallel-executor` | Independent parallel tasks |

**Reviewer agents** — read-only, dispatched by `/pre-push-review` or pre-push loop based on file types:

| Agent | Triggered by | Checks |
|-------|--------------|--------|
| `reviewer-security` | Always in review | Secrets, injection, CVEs |
| `reviewer-code-quality` | App / infra changes | Smells, complexity, best practices |
| `reviewer-frontend` | `*.tsx/ts/jsx/js/css` changes | React, TypeScript, a11y |
| `reviewer-design` | `*.tsx/jsx/css` changes | Byte Mark tokens, typography |
| `reviewer-infrastructure` | `.tf`, `.github/`, Dockerfile changes | GitHub Actions, IAM, Terraform |

## Docker
Claude runs in container via `pnpm claude` (no rebuild) or `pnpm claude:fresh` (rebuild image first). Pi runs via `pnpm pi` or `pnpm pi:fresh`. See `docs/DOCKER.md` for security model.

## Commands

### Local development
```bash
cd web && pnpm dev      # dev server
cd web && pnpm build    # production build
cd web && pnpm test     # unit tests (vitest)
pnpm claude             # Claude Code (Docker)
pnpm pi                 # pi (Docker)
git push                # push + pre-push review loop + auto PR generation (aliased by setup-local.sh)
```

### Documentation
The husky `prepare` hook automatically runs `scripts/setup-local.sh` to configure the `git push` alias. If manually pushing without the alias, run `scripts/pre-push-iterate.sh` before pushing.
