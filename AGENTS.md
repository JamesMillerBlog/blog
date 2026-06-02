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

| Tool                            | Config     | When to Use                                                     |
| ------------------------------- | ---------- | --------------------------------------------------------------- |
| **Claude Code** (`pnpm claude`) | `.claude/` | Interactive dev — uses Claude Pro subscription                  |
| **pi** (`pnpm pi`)              | `.pi/`     | CI automation + interactive fallback — multi-model via OpenCode |

### Claude Code

Interactive AI harness. Uses your Claude Pro subscription via OAuth. Run in Docker:

```bash
pnpm claude                          # interactive
pnpm claude:fresh                    # rebuild image then interactive
```

**Models (`.claude/agents/`):**

| Agent type           | Model                    |
| -------------------- | ------------------------ |
| `reviewer-security`  | `claude-sonnet-4-6`      |
| All other agents     | `claude-haiku-4-5-20251001` |

### pi

Multi-model harness used for both CI automation workflows and interactive fallback. Routes to models via two provider prefixes:

- **`opencode-go/*`** — OpenCode Go binary (DeepSeek V4 Flash/Pro, Kimi K2.6) — default for implementation and review
- **`opencode/*`** — OpenCode service routing (Claude Sonnet, GPT-5.5, Gemini Flash) — used for council agents

```bash
pnpm pi                              # interactive (default: opencode-go/deepseek-v4-pro)
pnpm pi:fresh                        # rebuild image then interactive
pi --model opencode-go/kimi-k2.6     # switch to Kimi inline
pi --model opencode/claude-sonnet-4-6  # switch to Claude via opencode
```

Inside pi, use `/model` or Ctrl+L to switch providers at any time.

**Models in use (CI scripts and agents):**

| Task                             | Model                            |
| -------------------------------- | -------------------------------- |
| Implementation (`ai-implement`)  | `opencode-go/deepseek-v4-pro`    |
| PR review (`ai-pr-review-run.sh`) | `opencode/claude-sonnet-4-6`     |
| Fix/respond (`ai-respond.sh`)    | `opencode-go/deepseek-v4-pro`    |
| E2E test generation              | `opencode-go/deepseek-v4-pro`    |
| Blog suggestions                 | `opencode-go/deepseek-v4-pro`    |
| Doc updates                      | `opencode-go/deepseek-v4-flash`  |
| PR generation                    | `opencode-go/deepseek-v4-flash`  |
| Council scouts (×2)              | `opencode-go/deepseek-v4-flash`  |
| Council analyst                  | `opencode/claude-sonnet-4-6`     |
| Council critic                   | `opencode/gpt-5.5`               |
| Council synthesizer              | `opencode/gemini-3.5-flash`      |

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

**Reviewer agents** — read-only, dispatched by PR review workflow based on changed file types:

| Agent                        | Model                    | Dispatched when                         | Checks                                      |
| ---------------------------- | ------------------------ | --------------------------------------- | ------------------------------------------- |
| `reviewer-security`          | `claude-sonnet-4-6`      | always                                  | Secrets, injection, CVEs, exploitable logic |
| `reviewer-code-quality`      | `claude-haiku-4-5-20251001` | app / infra changes                  | Smells, complexity, best practices          |
| `reviewer-frontend`          | `claude-haiku-4-5-20251001` | `*.tsx/ts/jsx/js/css`                | React, TypeScript, a11y                     |
| `reviewer-design`            | `claude-haiku-4-5-20251001` | `*.tsx/jsx/css`                      | Byte Mark tokens, typography                |
| `reviewer-infrastructure`    | `claude-haiku-4-5-20251001` | infra / CI / Docker / Terraform changes | GitHub Actions, IAM, Terraform          |

## Docker

Claude runs in container via `pnpm claude` (no rebuild) or `pnpm claude:fresh` (rebuild image first). Pi runs via `pnpm pi` or `pnpm pi:fresh`. See `docs/DOCKER.md` for security model.

## GitHub Workflows

### AI Development (OpenCode/pi)

Eight workflows automate issue implementation, PR review, and blog improvement using OpenCode:

| Workflow                       | Trigger                                                              | What it does                                                                                                                                              |
| ------------------------------ | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai-issue.yml`                 | Issue labeled `ai-implement` (repo owner only)                       | Runs council pre-implementation review, implements issue with deepseek-v4-pro, runs deterministic criteria check loop, creates draft PR, deploys ephemeral preview, generates E2E tests, runs Playwright tests |
| `ai-issue-comment.yml`         | Issue comment `/ai <instruction>`, `/resume`, `/retry`, or `/council <question>` (repo owner only) | Runs council for `/council <question>`; finds existing branch/PR for `/ai`/`/resume`/`/retry`; if no branch → re-implements from scratch; `/ai` applies fix then re-deploys preview; `/resume` re-deploys preview without code change; `/retry` re-runs full implementation on existing branch |
| `ai-pr-comment.yml`            | PR comment or inline review comment with `/ai <instruction>`, `/resume`, or `/council <question>` (repo owner only) | Runs council for `/council <question>`; `/ai` applies fix via ai-respond.sh, re-deploys preview; `/resume` re-deploys preview without code change        |
| `ai-pr-review.yml`             | PR opened, reopened, or updated (same-repo only)                     | Runs multi-agent AI review (claude-sonnet-4-6) on the PR diff, posts verdict, dispatches auto-fix if DO_NOT_PUSH and iterations < 3, labels PR needs-human after max iterations |
| `ai-pr-review-respond.yml`     | `repository_dispatch: pr-review-needs-fix`                           | Validates inputs, applies deepseek-v4-pro fixes for CRITICAL/HIGH findings, pushes (triggering re-review), tracks iterations via PR labels, posts emoji status |
| `ai-pr-merged.yml`             | AI-generated PR merged (auto)                                        | Closes linked issue, destroys ephemeral preview environment (Terraform destroy), marks deployment inactive                                                |
| `ai-blog-suggestions.yml`      | Monthly schedule (1st of month) or manual trigger (repo owner)       | Runs blog improvement radar: researches competitor blogs & trends, generates 8-15 prioritized suggestions, creates GitHub issue with `blog-radar` label  |
| `destroy-preview-manual.yml`   | Manual workflow trigger (repo owner)                                 | Destroys a specific PR's ephemeral preview environment                                                                                                    |

See `docs/AGENTIC_WORKFLOW.md` for full details including preview deployment architecture, issue template, and E2E test generation.

### Security Scanning & Audit

Four workflows provide continuous security monitoring:

| Workflow                     | Trigger                                                | What it does                                                                                                                                    |
| ---------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `codeql.yml`                 | Push to main, PR, scheduled Saturday 08:00 UTC         | CodeQL static analysis for JavaScript/TypeScript, uploads results to code scanning tab                                                           |
| `pr-security.yml`            | All PRs                                                | Dependency audit (critical CVEs block, high/medium informational), gitleaks secret scanning on PR commits                                       |
| `security-audit.yml`         | Scheduled Saturday 06:00 UTC, manual trigger           | Weekly comprehensive audit: dependencies, secrets, SAST, containers, Terraform, CI/CD. Creates or updates draft security advisory, creates `ai-implement` issue with summary counts if findings exist |
| `security-scorecard.yml`     | Scheduled Saturday 07:00 UTC, push to main, manual     | OSSF Scorecard analysis, publishes badge and uploads SARIF to code scanning                                                                    |

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
