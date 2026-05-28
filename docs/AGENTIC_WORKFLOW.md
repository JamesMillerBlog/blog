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

| Agent | Model | What it checks |
|-------|-------|---------------|
| `reviewer-security` | claude-sonnet-4-6 | Secrets, injection, CVEs, exploitable logic, prompt injection in diff |
| `reviewer-frontend` | claude-haiku-4-5 | React/Next.js patterns, TypeScript safety, accessibility, performance |
| `reviewer-design` | claude-haiku-4-5 | Byte Mark compliance — tokens, typography, borders, corner radii |
| `reviewer-infrastructure` | claude-haiku-4-5 | GitHub Actions injection, IAM permissions, Terraform misconfigs |
| `reviewer-code-quality` | claude-haiku-4-5 | Syntax, code smells, complexity, naming, reusability, best practices |

(Security reviewer runs on Sonnet for deeper adversarial coverage; others use Haiku for speed.)

### pi — Skills & Multi-Agent

pi doesn't have named agents in the same way as Claude, but it loads the same shared skills from `.agents/skills/` automatically. pi also supports:

- **Skills**: Loaded on-demand. Your shared skills (design, frontend, infrastructure, security) are available.
- **Multi-agent**: The `agent_team` tool (via `pi-multiagent` extension) lets pi spawn parallel sub-agents with their own isolated context — useful for code review, scouting, and parallel audits.
- **Prompt templates**: Reusable workflow prompts via `/template-name`.

#### pi Council of Agents

For complex questions or tasks that benefit from multiple perspectives, pi has a built-in council workflow. Pass any question to `scripts/council.sh` and it dispatches a graph of specialist agents in parallel before synthesising a final answer.

```bash
./scripts/council.sh "Should I use server components or client components for this feature?"
```

**How it works:**

```
[scout] → maps the question, identifies sub-angles
     ↓              ↓
[analyst]       [critic]       ← run in parallel
(deepseek-v4-pro) (kimi-k2.6)
     ↓              ↓
       [synthesizer]           ← combines both perspectives
       (deepseek-v4-pro)
```

| Agent | Model | Role |
|-------|-------|------|
| `council-analyst` | deepseek-v4-pro | Deep analytical thinking, structured reasoning |
| `council-critic` | kimi-k2.6 | Adversarial critique, risks, failure modes |
| `council-synthesizer` | deepseek-v4-pro | Synthesises perspectives into final answer |

Agent definitions live in `.pi/agents/`. The orchestration prompt is `.pi/prompts/council.md`.

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

Five GitHub workflows automate AI-driven development:

### AI Issue Implementation (`ai-implement` label)

**When:** An issue is labeled `ai-implement` by the repo owner.

**What happens:**
1. Creates a branch: `ai/issue-{number}-{slug}`
2. Phase 1 — **Implementation** (`deepseek-v4-pro`) — implements the issue based on title and body
3. Phase 2 — **Pre-push review loop** (local, up to 10 iterations) — validates changes before any push. Issues found → deepseek fixes locally → re-reviews → passes
4. Phase 3 — **Push and create draft PR** — writes review stamp, pushes branch, creates draft PR on GitHub
5. Phase 4 — **Preview deployment** — if PR created successfully:
   - Deploys site to ephemeral Cloudflare R2 bucket: `https://pr-{number}.staging.jamesmiller.blog`
   - Generates AI E2E tests from issue acceptance criteria
   - Runs Playwright tests against preview
   - Registers GitHub deployment and posts Playwright report link
6. Phase 5 — **PR summary comment** — posts comprehensive implementation + review log to PR
7. Phase 6 — **Independent code review** — Kimi K2.6 reviews the PR and posts findings as a comment

**To trigger:** Label an issue with `ai-implement` (repo owner only). Use the template at `.github/ISSUE_TEMPLATE/ai-implement.yml`.

**Issue template fields:**
- **Description** — what needs building/fixing (required)
- **Acceptance Criteria** — bullet-point list of testable criteria (used to generate E2E tests, required)
- **Technical Context** — relevant files, components, links (optional)
- **Design Notes** — UI/UX requirements, Byte Mark references (optional)
- **Out of Scope** — what AI should NOT change (optional)

**Example workflow:**
```
Issue: "Add dark mode toggle to homepage"
↓ (label ai-implement)
Branch: ai/issue-123-add-dark-mode-toggle
↓ (Phase 1: deepseek implements)
↓ (Phase 2: review loop locally — fixes issues, passes)
↓ (Phase 3: push + create draft PR #456)
↓ (Phase 4: deploy to pr-456.staging.jamesmiller.blog, run generated E2E tests)
↓ (Phase 5: post implementation + review summary to PR)
↓ (Phase 6: Kimi K2.6 independent review)
Preview live + tests pass/fail visible in Actions
```

### AI Issue Comment Response (`ai-issue-comment` workflow)

**When:** A repo owner comments `/ai <instruction>` or `/resume` on an issue.

**What happens:**
1. Detects existing branch+PR for this issue number
2. If no branch exists → re-implements from scratch (same as `ai-issue.yml` but runs in the comment workflow)
3. If branch exists and `/ai <instruction>` → applies fix via `ai-respond.sh`, pushes, runs Kimi K2.6 review, re-deploys preview
4. If branch exists and `/resume` → re-deploys preview environment without code changes

**Why:** Lets you iterate on an AI-generated feature by commenting `/ai` with instructions, or restart preview deployment with `/resume`, all without leaving GitHub.

### AI PR Comment Response (`ai-pr-comment` workflow)

**When:** A repo owner comments `/ai <instruction>` or `/resume` on a pull request.

**What happens:**
1. `/ai <instruction>` → runs `ai-respond.sh` to apply the fix, pushes changes, posts result summary, runs Kimi K2.6 review, then re-deploys preview environment
2. `/resume` → re-deploys preview environment without code changes

**Why:** Enables rapid iteration on PRs — comment `/ai fix the heading colour` and the AI implements, reviews, and re-deploys automatically.

### AI PR Merged — Auto-cleanup (`ai-pr-merged` workflow)

**When:** An AI-generated PR (branch starts with `ai/issue-`) is merged.

**What happens:**
1. Closes the linked issue automatically
2. Destroys the ephemeral preview environment (Terraform destroy)
3. Marks the GitHub deployment as inactive

### Destroy Preview Environment — Manual (`destroy-preview-manual` workflow)

**When:** Triggered manually via GitHub Actions UI (repo owner).

**What happens:**
1. Asks for PR number
2. Destroys that PR's preview environment and marks deployment inactive
3. Useful if PR is abandoned or preview needs early cleanup

### Configuration

- **`.pi/settings.ci.json`** — CI-specific pi settings: uses `deepseek-v4-pro` by default, enables `pi-lens` and `pi-multiagent` extensions
- **`.pi/prompts/`** — Workflow prompt templates:
  - `ai-issue-implement.md` — issue implementation instructions
  - `ai-pr-respond.md` — PR comment response instructions
  - `ai-pr-review.md` — independent PR review (Kimi K2.6)
- **`infrastructure/stacks/site/ephemeral/`** — Terraform for ephemeral preview environments:
  - `main.tf` — Cloudflare R2 bucket, custom domain, Workers Basic Auth
  - `variables.tf` — PR number, Cloudflare credentials, Basic Auth credentials

### Scripts

| Script | Purpose |
|--------|---------|
| `scripts/ai-implement.sh` | Issue implementation + pre-push review loop + PR creation + summary |
| `scripts/ai-pr-review.sh` | Kimi K2.6 independent code review |
| `scripts/ai-respond.sh` | Respond to PR comments with `/ai <instruction>` |
| `scripts/ai-generate-tests.sh` | Generates Playwright E2E tests from issue description using `deepseek-v4-pro` |
| `scripts/generate-pr.sh` | Supports `--draft` flag and CI mode |

### Infrastructure — Ephemeral Preview Environments

Each AI-generated PR gets an ephemeral preview environment for live testing:

- **R2 Bucket:** `jamesmiller-blog-pr-{number}` — auto-created, ephemeral (no `prevent_destroy`)
- **Domain:** `pr-{number}.staging.jamesmiller.blog` — custom domain via Cloudflare
- **Auth:** Basic Auth via Cloudflare Workers (same credentials as staging)
- **Lifecycle:** Created when PR is created, destroyed when PR is merged (or manually via destroy-preview-manual workflow)

### Playwright Configuration

Updated for CI preview testing:

- `PLAYWRIGHT_BASE_URL` env var — if set, tests target remote preview instead of localhost
- `PLAYWRIGHT_BASIC_AUTH_USERNAME` & `PLAYWRIGHT_BASIC_AUTH_PASSWORD` env vars — auto-submitted for preview auth
- `CI=true` captures video/screenshots on failure, used by test report artifact

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
├── Dockerfile.claude     # Claude Code Docker image
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
