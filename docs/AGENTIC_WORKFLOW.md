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

## GitHub Workflows — Automated AI Issue Implementation & Review

Two GitHub workflows automate AI-driven development:

### AI Issue Implementation (`ai-implement` label)

**When:** An issue is labeled `ai-implement` by the repo owner.

**What happens:**
1. Creates a branch: `ai/issue-{number}-{slug}`
2. Runs `deepseek-v4-pro` to implement the issue based on the issue title and body
3. Creates a draft PR with the implementation
4. Runs a pre-push review loop (up to 10 iterations) to validate changes
5. Once passing, creates a final PR and transitions it to ready
6. Runs a Kimi K2.6 independent code review and posts findings as a PR comment

**To trigger:** Label an issue with `ai-implement` (repo owner only).

**Example workflow:**
```
Issue: "Add dark mode toggle to homepage"
↓ (label ai-implement)
Branch: ai/issue-123-add-dark-mode-toggle
↓ (deepseek implements)
Draft PR #456 created
↓ (pre-push review loop)
Issues found → deepseek fixes → re-reviews → passes
↓ (Kimi K2.6 review)
Independent code review posted
↓ (PR marked ready for human review)
```

### AI PR Comment Response (`/ai` command)

**When:** A comment on an AI-initiated PR starts with `/ai <instruction>` (repo owner only).

**What happens:**
1. Checks out the PR branch
2. Runs `deepseek-v4-pro` to action the instruction (e.g., "add loading state" or "fix the TypeScript error")
3. Commits changes
4. Posts result as a PR comment
5. Pushes changes

**Example:** Comment `/ai add a loading spinner while data is fetching` on a PR — OpenCode will implement it and commit.

### Configuration

- **`.pi/settings.ci.json`** — CI-specific pi settings: uses `deepseek-v4-pro` by default, enables `pi-lens` and `pi-multiagent` extensions
- **`.pi/prompts/`** — Workflow prompt templates:
  - `ai-issue-implement.md` — issue implementation instructions
  - `ai-pr-respond.md` — PR comment response instructions
  - `ai-pr-review.md` — independent PR review (Kimi K2.6)

### Scripts

| Script | Purpose |
|--------|---------|
| `scripts/ai-implement.sh` | Issue implementation + pre-push review loop |
| `scripts/ai-pr-review.sh` | Kimi K2.6 independent code review |
| `scripts/ai-respond.sh` | Respond to PR comments with `/ai <instruction>` |
| `scripts/generate-pr.sh` | (updated) Supports `--draft` flag and CI mode |

All scripts post progress to the PR as comments, allowing real-time monitoring of the AI workflow.

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

Before pushing to a public branch, run a multi-agent review inside Claude Code:

```
/pre-push-review
```

Then push:

```bash
git push
```

The pre-push hook runs a local `gitleaks` scan when available, then tests, then checks that the review stamp matches `HEAD`. If you push without running `/pre-push-review` first, the push is blocked. Bypass with `git push --no-verify` only if you have a good reason.

**When using pi:** You can still run the review scripts manually (`bash scripts/pre-push-review-manifest.sh`, `bash scripts/pre-push-static-checks.sh`) and ask pi to review the output, but pi has no equivalent of the full multi-agent `/pre-push-review` command. Use `git push --no-verify` or run the review in Claude before switching.

### What `/pre-push-review` produces

1. **Architecture / Flow Diagram** — ASCII diagram if changes affect structure, data flow, or CI
2. **Findings by severity** — aggregated across the reviewers selected for the current diff (CRITICAL / HIGH / MEDIUM / LOW)
3. **Verdict** — SAFE TO PUSH / DO NOT PUSH / PUSH WITH CAUTION

### Reviewers

| Reviewer | Focus |
|----------|-------|
| `reviewer-security` | Secrets, injection, CVEs, exploitable logic |
| `reviewer-frontend` | React/Next.js patterns, TypeScript, accessibility |
| `reviewer-design` | Byte Mark compliance — tokens, typography, borders |
| `reviewer-infrastructure` | GitHub Actions injection, IAM, Terraform misconfigs |
| `reviewer-code-quality` | Syntax, smells, complexity, naming, best practices |

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
