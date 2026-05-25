# Agentic Workflow

This repo is designed for AI-assisted development using two AI harnesses. The core idea: both tools share the same project context, so switching between them is a model choice — not a context rebuild.

## The Pattern

**Start with Claude Code. Always.**

Claude is the primary agent using your Claude Pro subscription. It has richer tooling (plugins, hooks, multi-agent dispatch, pre-push review). Only reach for pi when you run out of Claude usage.

**pi is the fallback.** When Claude usage is exhausted, switch to pi and continue with the same shared context. pi supports multiple model providers (OpenCode Go, Gemini, Codex, DeepSeek, OpenRouter) — all from the same harness.

## When to Reach for pi

| Situation | What to do |
|-----------|-----------|
| Claude usage exhausted | `pnpm pi` — continues with same project context |
| Want a different model | Inside pi: `/model google` or `/model opencode-go/deepseek-v4-pro` |
| Quick one-shot query | `pnpm pi -p "find all TypeScript interfaces"` |
| Need parallel review | pi has `agent_team` tool (via `pi-multiagent` extension) for parallel sub-agents |

---

## Using Agents & Skills

### Claude Code Agents

Specialist agents focus Claude on a specific domain. Switch agents with `/agent <name>`:

```
/agent frontend-dev
/agent design-expert
/agent infrastructure
/agent security-auditor
/agent parallel-executor
```

#### Writer agents — implement and build

| Agent | Purpose | When to use |
|-------|---------|-------------|
| `frontend-dev` | UI components, Next.js pages | Building or modifying any UI |
| `design-expert` | Byte Mark design system compliance | Checking or enforcing design rules |
| `infrastructure` | Terraform & AWS | Any infra or CI/CD work |
| `security-auditor` | Security vulnerability review | Auditing code or dependencies |
| `parallel-executor` | Multiple independent tasks in parallel | When you have work that doesn't depend on itself |

#### Reviewer agents — adversarial, read-only (Claude Code only)

Dispatched automatically by `/pre-push-review`. Never write code — they review diffs adversarially.

| Agent | What it checks |
|-------|---------------|
| `reviewer-security` | Secrets, injection, CVEs, exploitable logic, prompt injection in diff |
| `reviewer-frontend` | React/Next.js patterns, TypeScript safety, accessibility, performance |
| `reviewer-design` | Byte Mark compliance — tokens, typography, borders, corner radii |
| `reviewer-infrastructure` | GitHub Actions injection, IAM permissions, Terraform misconfigs |
| `reviewer-code-quality` | Syntax, code smells, complexity, naming, reusability, best practices |

### pi — Skills & Multi-Agent

pi doesn't have named agents in the same way as Claude, but it loads the same shared skills from `.agents/skills/` automatically. pi also supports:

- **Skills**: Loaded on-demand. Your shared skills (design, frontend, infrastructure, security) are available.
- **Multi-agent**: The `agent_team` tool (via `pi-multiagent` extension) lets pi spawn parallel sub-agents with their own isolated context — useful for code review, scouting, and parallel audits.
- **Prompt templates**: Reusable workflow prompts via `/template-name`.

### Example prompts per agent/skill

**frontend-dev** — building UI:
```
Build a new "Featured Post" card component that shows the cover image, title, excerpt and reading time. It should follow the existing card patterns and be usable on the homepage.
```

**design-expert** — compliance review:
```
Review the new FeaturedPost card I just built against the Byte Mark design system. Check colours, typography classes, border usage, and corner radii. Flag anything that deviates.
```

**security-auditor** — dependency + code audit:
```
Run a full security audit. Check pnpm audit for known CVEs, then review the MDX rendering pipeline and any user-facing inputs for injection risks.
```

**infrastructure** — CI/CD or AWS work:
```
Add a GitHub Actions workflow that runs pnpm test and pnpm build on every PR, and blocks merge if either fails. Follow the pattern in the existing workflows.
```

---

## Working Agents Together on a Feature

For larger features, you can chain agents sequentially or run independent tasks in parallel.

### Sequential: design → build → review

Use this when each step depends on the previous one. Works in both Claude and pi.

**Step 1 — design-expert: spec the component**

> I want to add a "Related Posts" section at the bottom of each post page showing 3 posts with matching tags. Spec out the component structure and which Byte Mark patterns to use before we build anything.

*Claude: `/agent design-expert`. pi: load `/skill:design` or just prompt with design context.*

**Step 2 — frontend-dev: build it**

> Build the RelatedPosts component based on this spec: [paste spec from step 1]. Wire it into the post layout at web/src/app/posts/[slug]/page.tsx.

**Step 3 — design-expert: verify**

> Review the RelatedPosts component I just built. Check it against the Byte Mark spec — colours, type scale, spacing, borders, hover states.

**Step 4 — security-auditor: check before shipping**

> Review the RelatedPosts implementation. It queries posts by tag — check the tag filtering logic for any injection risks and verify no user input reaches the file system.

### Parallel: independent tasks (Claude Code or pi with multi-agent)

In Claude Code, switch to the `parallel-executor` agent to dispatch multiple agents simultaneously:

```
/agent parallel-executor

I'm building a tag filtering feature for the blog. These tasks are independent — run them in parallel:
1. Use the frontend-dev agent to build the TagFilter component.
2. Use the frontend-dev agent to update the PostGrid component.
3. Use the security-auditor agent to audit the tag handling in posts.ts.
4. Use the infrastructure agent to check the GitHub Actions pipeline.
```

In pi with the `pi-multiagent` extension installed, the `agent_team` tool can spawn parallel sub-agents for similar workflows, routing tasks to focused agents with their own context and tools.

---

## GitHub Actions Automation

### Automated Issue Implementation

When a GitHub issue is labeled with `ai`, a workflow automatically:

1. Creates a branch `ai/issue-{number}-{title-slug}`
2. Reads AGENTS.md for project context
3. Runs `pi` to implement the issue autonomously
4. Posts progress comments to the issue
5. Runs typecheck and tests; fixes any failures
6. Executes pre-push review (`.pi/prompts/pre-push-review.md`)
7. Commits changes and pushes
8. Opens a PR (triggering the auto-review workflow)

**Protection**: The issue body is sanitized against prompt injection. Commands or system prompts embedded in the issue body are treated as data, never instructions.

### Automated PR Review

When a PR is opened or updated, a workflow automatically:

1. Checks out the base branch (safe for script execution)
2. Fetches the PR head for diff context
3. Runs `pi` with PR review agents via `agent_team`
4. Dispatches agents with model diversity: security via deepseek, others via kimi
5. Parses each agent's findings and aggregates by severity
6. Posts consolidated review as a PR comment

Reviewers are selected based on changed file types. See `.pi/prompts/pr-review.md` for details.

---

## Commit & Push Workflow

### Committing

```bash
git commit -m "your message"
```

The pre-commit hook runs automatically:
1. Lint, typecheck, format check
2. AI docs update — reads the staged diff and surgically edits `AGENTS.md`, `CLAUDE.md`, and files under `.agents/skills/` and `.claude/agents/` to reflect what changed. Any updated doc files are staged and included in the commit.

To skip the docs update (e.g. for a quick WIP commit):

```bash
SKIP_DOCS_UPDATE=1 git commit -m "wip"
```

### Pushing

```bash
git push
```

The `.husky/pre-push` hook automatically runs `bash scripts/pre-push-iterate.sh`, which:

1. **Reviews**: Stages all changes and runs a multi-agent pre-push review via claude or pi
2. **Fixes**: If CRITICAL or HIGH findings exist, automatically fixes them and re-tests
3. **Iterates**: Up to 10 review → fix → test cycles until clean or blocked
4. **Verdict**: Exits with 0 only when `SAFE TO PUSH`. Blocks push if issues remain after max iterations.
5. **Generates PR**: After push succeeds, `scripts/generate-pr.sh` is called to create/update the PR

Findings are written to `.pre-push-review/findings.md` and verdict to `.pre-push-review/verdict`.

To skip the hook (not recommended):
```bash
git push --no-verify
```

### Pre-push review behavior

The review loop:
1. Runs claude first (`.claude/prompts/pre-push-review.md`) — full multi-agent review
2. Falls back to pi (`.pi/prompts/pre-push-review.md`) if claude unavailable
3. Parses verdict from findings file
4. If SAFE TO PUSH → allows push; otherwise attempts fix cycle
5. Each fix cycle: runs claude or pi to fix CRITICAL/HIGH issues, re-runs typecheck and tests
6. Stops after 10 iterations regardless to prevent infinite loops

Reviewers dispatched based on changed file types:

| Reviewer | Triggered when | Checks |
|----------|---|---|
| `reviewer-security` | Always | Secrets, injection, CVEs, exploitable logic |
| `reviewer-frontend` | `*.tsx/ts/jsx/js/css` changed | React/Next.js patterns, TypeScript, accessibility |
| `reviewer-design` | `*.tsx/jsx/css` changed | Byte Mark compliance — tokens, typography, borders |
| `reviewer-infrastructure` | `.tf`, `.github/`, Dockerfile changed | GitHub Actions injection, IAM, Terraform misconfigs |
| `reviewer-code-quality` | App code changed | Syntax, smells, complexity, naming, best practices |

### Automatic PR generation

After `git push` succeeds, `pnpm pr:generate` (or `scripts/generate-pr.sh`) is called to create or update the PR. This runs claude or pi to fill in PR title and body. Falls back if both tools unavailable.

### Critical vulnerability handling

If a critical issue is found, the reviewer states the severity label only — it does not publish exploit details. It will advise resolving it before pushing and direct you to open a private advisory via `.github/SECURITY.md`.

### Prompt injection defence

Reviewers treat all diff content as untrusted data. If anything in the diff reads as an instruction directed at the reviewer, it is flagged as a HIGH severity finding rather than followed.

---

## Shared Context

Switching tools doesn't mean starting over. Both harnesses read the same project context automatically.

| Layer | What it contains | Loaded by |
|-------|-----------------|-----------|
| `AGENTS.md` | Project overview, conventions, structure | Both (auto-discovered) |
| `CLAUDE.md` | Symlink to AGENTS.md | Claude Code |
| `web/design/DESIGN.md` | Byte Mark design system spec | Both |
| `.agents/skills/` | Shared skill specs — design, frontend, infra, security | Both (pi: auto-discovered, Claude: configured in settings) |
| `.claude/agents/` | Claude agent definitions | Claude Code only |

---

## Decision Guide

| Situation | Reach for |
|-----------|-----------|
| Normal development | Claude Code |
| Claude usage exhausted | `pnpm pi` |
| Want a different model | pi → `/model` to switch provider |
| Need multi-agent review | Claude Code → `/pre-push-review` |
| Quick lookup | `pnpm pi -p "find..."` |

---

## Reference

### Config files

```
├── AGENTS.md             # Shared project context (all tools read this)
├── CLAUDE.md             # Claude Code entry point (symlink to AGENTS.md)
├── .agents/skills/       # Shared skill definitions (auto-loaded by both)
├── .claude/              # Claude Code agents, commands, settings
├── .pi/                  # pi config, extensions, settings
├── Dockerfile            # Claude Code Docker image
├── Dockerfile.pi         # pi Docker image
├── docker/               # Docker config files
└── web/design/DESIGN.md  # Byte Mark design system
```

### CLI Commands

```bash
pnpm claude              # Start Claude Code (Docker, primary)
pnpm claude:fresh        # Rebuild Claude image then start
pnpm pi                  # Start pi (Docker, fallback)
pnpm pi:fresh            # Rebuild pi image then start
pi -p "query"            # One-shot prompt with pi
pi --model google        # Start pi with specific provider
```

### Docker

Both AI tools run inside Docker with the repo mounted at `/workspace`. See `docs/DOCKER.md` for details on volumes, credentials, and worktree support.
