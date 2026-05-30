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
- `.ai-evals/` — quality gate thresholds, run data, trends
- `.claude/agents/` — Claude Code agents
- `.pi/agents/` — pi custom agent definitions (council, etc.)
- `.pi/prompts/` — pi workflow prompt templates
- `.pi/settings.ci.json` — CI-specific pi configuration
- `.github/workflows/ai-*.yml` — GitHub workflows for AI automation

## AI Tools

| Tool                            | Config     | When to Use                                         |
| ------------------------------- | ---------- | --------------------------------------------------- |
| **Claude Code** (`pnpm claude`) | `.claude/` | Primary — uses Claude Pro subscription              |
| **pi** (`pnpm pi`)              | `.pi/`     | Fallback — OpenCode, Gemini, Codex, DeepSeek models |

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

## Code Formatting — All AI Tools

All AI tools (Claude Code and pi) must follow these formatting conventions. Match existing file style when editing — do not change formatting of unchanged lines.

- **Indentation:** spaces only, 2-space indent. Never tabs (except Makefiles).
- **YAML:** single-quoted strings (`'22'` not `"22"`, `''` not `""`). 2-space indent.
- **Shell scripts:** 2-space indent with spaces. Line continuation with `\` (backslash). Pipe chains use `|` at end of continued line, next line indented with 4 spaces for visual alignment.
- **JSON/TS/JS/TSX/CSS:** per `.prettierrc` in `web/`: single quotes, no semicolons, trailing commas (ES5), 100 print width.
- **Markdown:** 2-space indent in code blocks. No trailing whitespace.
- **When editing:** preserve surrounding formatting. Only change lines that need functional changes.

## Design System — Byte Mark

Full spec: `web/design/DESIGN.md`. Key tokens:

- Primary: `#00675d` · Secondary: `#a02d70`
- UI: Plus Jakarta Sans · Content: Newsreader
- No 1px borders · `rounded-xl`+ · color shifts for depth

## Claude Agents

**Writer agents** — implement and build:

| Agent               | Role                          |
| ------------------- | ----------------------------- |
| `frontend-dev`      | UI components, pages, styling |
| `design-expert`     | Byte Mark compliance          |
| `infrastructure`    | Terraform & AWS               |
| `security-auditor`  | Vulnerability scanning        |
| `parallel-executor` | Independent parallel tasks    |

**Reviewer agents** — read-only, dispatched by `/pre-push-review` based on review mode and changed file types:

| Agent                        | Dispatched when                         | Checks                                      |
| ---------------------------- | --------------------------------------- | ------------------------------------------- |
| `reviewer-security`          | always                                  | Secrets, injection, CVEs, exploitable logic |
| `reviewer-code-quality`      | app / infra changes                     | Smells, complexity, best practices          |
| `reviewer-frontend`          | `*.tsx/ts/jsx/js/css`                   | React, TypeScript, a11y                     |
| `reviewer-design`            | `*.tsx/jsx/css`                         | Byte Mark tokens, typography                |
| `reviewer-infrastructure`    | infra / CI / Docker / Terraform changes | GitHub Actions, IAM, Terraform              |

(Security reviewer uses a more capable model for deeper adversarial coverage.)

## Docker

Claude runs in container via `pnpm claude` (no rebuild) or `pnpm claude:fresh` (rebuild image first). Pi runs via `pnpm pi` or `pnpm pi:fresh`. See `docs/DOCKER.md` for security model.

## GitHub Workflows

### AI Development (OpenCode/pi)

Six workflows automate issue implementation, PR management, and blog improvement using OpenCode:

| Workflow                     | Trigger                                                              | What it does                                                                                                                                              |
| ---------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai-issue.yml`               | Issue labeled `ai-implement` (repo owner only, or auto from security audit) | Runs council pre-implementation review, implements issue with deepseek-v4-pro, runs pre-push review loop, creates draft PR, deploys ephemeral preview, generates E2E tests, runs Playwright tests |
| `ai-issue-comment.yml`       | Issue comment `/ai <instruction>`, `/resume`, `/retry`, or `/council <question>` (repo owner only) | Runs council for `/council <question>`; finds existing branch/PR for `/ai`/`/resume`/`/retry`; if no branch → re-implements from scratch; `/ai` applies fix then re-deploys preview; `/resume` re-deploys preview without code change; `/retry` re-runs full implementation on existing branch |
| `ai-pr-comment.yml`          | PR comment `/ai <instruction>`, `/resume`, or `/council <question>` (repo owner only)        | Runs council for `/council <question>`; `/ai` applies fix via ai-respond.sh, runs Kimi review, re-deploys preview; `/resume` re-deploys preview without code change                               |
| `ai-pr-merged.yml`           | AI-generated PR merged (auto)                                        | Closes linked issue, destroys ephemeral preview environment (Terraform destroy), marks deployment inactive                                                |
| `ai-blog-suggestions.yml`    | Monthly schedule (1st of month) or manual trigger (repo owner)       | Runs blog improvement radar: researches competitor blogs & trends, generates 8-15 prioritized suggestions, creates GitHub issue with `blog-radar` label  |
| `destroy-preview-manual.yml` | Manual workflow trigger (repo owner)                                 | Destroys a specific PR's ephemeral preview environment                                                                                                    |

See `docs/AGENTIC_WORKFLOW.md` for full details including preview deployment architecture, issue template, and E2E test generation.

### Security Scanning & Audit

Four workflows provide continuous security monitoring:

| Workflow                  | Trigger                                               | What it does                                                                                                                                                                                          |
| ------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `codeql.yml`              | Push to main, PRs touching `web/src/**`, weekly Sat 8am UTC | CodeQL static analysis on JavaScript/TypeScript with extended security rules, publishes findings to code scanning                                                                                        |
| `pr-security.yml`         | All pull requests                                     | Runs pnpm audit (critical CVEs only) and gitleaks secret scanning on commits in the PR                                                                                                                 |
| `security-audit.yml`      | Weekly Saturday 6am UTC, manual dispatch              | Comprehensive security audit using semgrep (SAST), trivy (containers + IaC), and zizmor (GitHub Actions). Creates `ai-implement` issue if findings detected, which triggers `ai-issue.yml` for auto-fixes |
| `security-scorecard.yml`  | Weekly Saturday 7am UTC, push to main, manual dispatch | OSSF Scorecard analysis, publishes badge and SARIF results to code scanning                                                                                                                            |

See `docs/SECURITY_AUDIT.md` for manual security audit findings beyond automated scanning (prompt injection, MDX content, AI isolation, etc.).

## Commands

```bash
cd web && pnpm dev                  # dev server
cd web && pnpm build                # production build
cd web && pnpm test                 # unit tests (vitest)
cd web && pnpm audit:security       # run local security audit
pnpm claude                         # Claude Code (Docker)
pnpm claude:fresh                   # rebuild Claude image then interactive
pnpm pi                             # pi (Docker)
pnpm pi:fresh                       # rebuild pi image then interactive
pnpm council                        # Council of agents (pi-based)
```
