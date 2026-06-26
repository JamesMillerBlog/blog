# Agentic Workflow

This repo is designed for AI-assisted development using two AI harnesses. The core idea: both tools share the same project context, so switching between them is a model choice - not a context rebuild.

## The Pattern

**Start with Claude Code. Always.**

Claude is the primary agent using your Claude Pro subscription. It has richer tooling (plugins, hooks, multi-agent dispatch, pre-push review). Only reach for pi when you run out of Claude usage.

**pi is the fallback.** When Claude usage is exhausted, switch to pi and continue with the same shared context. pi supports multiple model providers (OpenCode Go, Gemini, Codex, DeepSeek, OpenRouter) - all from the same harness.

## When to Reach for pi

| Situation | What to do |
|-----------|-----------|
| Claude usage exhausted | `pnpm pi` - continues with same project context |
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

#### Writer agents - implement and build

| Agent | Purpose | When to use |
|-------|---------|-------------|
| `frontend-dev` | UI components, Next.js pages | Building or modifying any UI |
| `design-expert` | Byte Mark design system compliance | Checking or enforcing design rules |
| `infrastructure` | Terraform & AWS | Any infra or CI/CD work |
| `security-auditor` | Security vulnerability review | Auditing code or dependencies |
| `parallel-executor` | Multiple independent tasks in parallel | When you have work that doesn't depend on itself |

#### Reviewer agents - adversarial, read-only

Dispatched automatically by `ai-pr-review.yml` workflow when a PR is created or updated. Never write code - they review diffs adversarially.

| Agent | What it checks |
|-------|---------------|
| `reviewer-security` | Secrets, injection, CVEs, exploitable logic, prompt injection in diff |
| `reviewer-frontend` | React/Next.js patterns, TypeScript safety, accessibility, performance |
| `reviewer-design` | Byte Mark compliance - tokens, typography, borders, corner radii |
| `reviewer-infrastructure` | GitHub Actions injection, IAM permissions, Terraform misconfigs |
| `reviewer-code-quality` | Syntax, code smells, complexity, naming, reusability, best practices |

### pi - Skills & Multi-Agent

pi doesn't have named agents in the same way as Claude, but it loads the same shared skills from `.agents/skills/` automatically. pi also supports:

- **Skills**: Loaded on-demand. Your shared skills (design, frontend, infrastructure, security) are available.
- **Multi-agent**: The `agent_team` tool (via `pi-multiagent` extension) lets pi spawn parallel sub-agents with their own isolated context - useful for code review, scouting, and parallel audits.
- **Prompt templates**: Reusable workflow prompts via `/template-name`.

#### pi Council of Agents

For complex questions or tasks that benefit from multiple perspectives, pi has a built-in council workflow. Pass any question to `scripts/council.sh` and it dispatches a graph of specialist agents in parallel before synthesising a final answer.

```bash
./scripts/council.sh "Should I use server components or client components for this feature?"
```

**How it works:**

```
[scout-a]     [scout-b]       ← decompose question into dimensions
     ↓              ↓
[analyst]       [critic]       ← run in parallel
     ↓              ↓
       [synthesizer]           ← combines both perspectives
```

| Agent | Role |
|-------|------|
| `council-scout` | Decomposes question into structured dimensions |
| `council-analyst` | Deep analytical thinking, structured reasoning |
| `council-critic` | Adversarial critique, risks, failure modes |
| `council-synthesizer` | Synthesises perspectives into final answer |

Agent definitions live in `.pi/agents/`. The orchestration prompt is `.pi/prompts/council.md`.

### Example prompts per agent/skill

**frontend-dev** - building UI:
```
Build a new "Featured Post" card component that shows the cover image, title, excerpt and reading time. It should follow the existing card patterns and be usable on the homepage.
```

**design-expert** - compliance review:
```
Review the new FeaturedPost card I just built against the Byte Mark design system. Check colours, typography classes, border usage, and corner radii. Flag anything that deviates.
```

**security-auditor** - dependency + code audit:
```
Run a full security audit. Check pnpm audit for known CVEs, then review the MDX rendering pipeline and any user-facing inputs for injection risks.
```

**infrastructure** - CI/CD or AWS work:
```
Add a GitHub Actions workflow that runs pnpm test and pnpm build on every PR, and blocks merge if either fails. Follow the pattern in the existing workflows.
```

---

## Working Agents Together on a Feature

For larger features, you can chain agents sequentially or run independent tasks in parallel.

### Sequential: design → build → review

Use this when each step depends on the previous one. Works in both Claude and pi.

**Step 1 - design-expert: spec the component**

> I want to add a "Related Posts" section at the bottom of each post page showing 3 posts with matching tags. Spec out the component structure and which Byte Mark patterns to use before we build anything.

*Claude: `/agent design-expert`. pi: load `/skill:design` or just prompt with design context.*

**Step 2 - frontend-dev: build it**

> Build the RelatedPosts component based on this spec: [paste spec from step 1]. Wire it into the post layout at web/src/app/posts/[slug]/page.tsx.

**Step 3 - design-expert: verify**

> Review the RelatedPosts component I just built. Check it against the Byte Mark spec - colours, type scale, spacing, borders, hover states.

**Step 4 - security-auditor: check before shipping**

> Review the RelatedPosts implementation. It queries posts by tag - check the tag filtering logic for any injection risks and verify no user input reaches the file system.

### Parallel: independent tasks (Claude Code or pi with multi-agent)

In Claude Code, switch to the `parallel-executor` agent to dispatch multiple agents simultaneously:

```
/agent parallel-executor

I'm building a tag filtering feature for the blog. These tasks are independent - run them in parallel:
1. Use the frontend-dev agent to build the TagFilter component.
2. Use the frontend-dev agent to update the PostGrid component.
3. Use the security-auditor agent to audit the tag handling in posts.ts.
4. Use the infrastructure agent to check the GitHub Actions pipeline.
```

In pi with the `pi-multiagent` extension installed, the `agent_team` tool can spawn parallel sub-agents for similar workflows, routing tasks to focused agents with their own context and tools.

---

## GitHub Workflows - Automated AI Issue Implementation, Review & Blog Radar

Eight GitHub workflows automate AI-driven development:

### AI Issue Implementation (`ai-implement` label)

**When:** An issue is labeled `ai-implement` by the repo owner.

**What happens:**
1. Creates a branch: `ai/issue-{number}-{slug}`
2. Phase 0 - **Council pre-implementation review** - multi-model council (analysts + critic + synthesizer) reviews the issue architecture and produces an implementation plan with checklist
3. Phase 1 - **Implementation** (`deepseek-v4-pro`) - implements the issue based on title, body, and council plan
4. Phase 2 - **Criteria check loop** (up to 3 iterations) - runs deterministic checks: build, TypeScript typecheck, test coverage, console.log scan, secret pattern scan. Failures trigger deepseek-v4-pro auto-fix before re-checking
5. Phase 3 - **Push and create draft PR** - pushes branch, creates draft PR on GitHub
6. Phase 4 - **Preview deployment** - if PR created successfully:
   - Deploys site to ephemeral Cloudflare R2 bucket: `https://pr-{number}.staging.jamesmiller.blog`
   - Generates AI E2E tests from issue acceptance criteria
   - Runs Playwright tests against preview
   - Registers GitHub deployment and posts Playwright report link
7. Phase 5 - **PR summary comment** - posts implementation log to PR
8. Phase 6 - **AI PR review** - `ai-pr-review.yml` triggers automatically on PR creation and runs multi-agent review

**To trigger:** Label an issue with `ai-implement` (repo owner only). Use the template at `.github/ISSUE_TEMPLATE/ai-implement.yml`.

**Issue template fields:**
- **Description** - what needs building/fixing (required)
- **Acceptance Criteria** - bullet-point list of testable criteria (used to generate E2E tests, required)
- **Technical Context** - relevant files, components, links (optional)
- **Design Notes** - UI/UX requirements, Byte Mark references (optional)
- **Out of Scope** - what AI should NOT change (optional)

**Example workflow:**
```
Issue: "Add dark mode toggle to homepage"
↓ (label ai-implement)
Branch: ai/issue-123-add-dark-mode-toggle
↓ (Phase 1: deepseek implements)
↓ (Phase 2: criteria check loop - build/typecheck/coverage/lint passes)
↓ (Phase 3: push + create draft PR #456)
↓ (Phase 4: deploy to pr-456.staging.jamesmiller.blog, run generated E2E tests)
↓ (Phase 5: post implementation summary to PR)
↓ (Phase 6: ai-pr-review.yml triggers → claude-sonnet-4-6 reviews diff)
↓ (if DO_NOT_PUSH: ai-pr-review-respond.yml applies fixes, re-triggers review)
Preview live + tests pass/fail visible in Actions
```

### AI Issue Comment Response (`ai-issue-comment` workflow)

**When:** A repo owner comments `@ai <instruction>`, `/resume`, `/retry`, or `@council <question>` on an issue.

**What happens:**
1. If `@council <question>` → runs council of agents on the question and posts answer
2. Otherwise: detects existing branch+PR for this issue number
3. If no branch exists → re-implements from scratch (same as `ai-issue.yml` but runs in the comment workflow)
4. If branch exists and `@ai <instruction>` → applies fix via `ai-respond.sh`, pushes, re-deploys preview (AI review triggers automatically via PR update)
5. If branch exists and `/resume` → re-deploys preview environment without code changes
6. If `/retry` → force-re-runs full implementation from scratch on the existing branch (clean checkout, re-run ai-implement.sh)

**Why:** Lets you iterate on an AI-generated feature by commenting `@ai` with instructions, consult the council with `@council` for advice, or restart preview deployment with `/resume`, all without leaving GitHub.

### AI PR Comment Response (`ai-pr-comment` workflow)

**When:** A repo owner comments `@ai <instruction>`, `/resume`, `@review`, `/rate <good|bad> [reason]`, or `@council <question>` on a pull request.

**What happens:**
1. If `@council <question>` → runs council of agents on the question and posts answer
2. If `@ai <instruction>` → runs `ai-respond.sh` to apply the fix, pushes changes, posts result summary (AI review triggers automatically via PR update)
3. If `/resume` → re-deploys preview environment without code changes
4. If `@review` → dispatches `ai-pr-review.yml` for multi-agent code review
5. If `/rate good [reason]` or `/rate bad [reason]` → records human feedback to Langfuse trace for this PR (used for AI quality monitoring)

**Why:** Enables rapid iteration on PRs - comment `@ai fix the heading colour` and the AI implements and re-deploys automatically. Use `@council` for architectural guidance, `@review` to trigger review anytime, and `/rate` to provide feedback for improving AI output quality.

### AI PR Review (`ai-pr-review` workflow)

**When:** A PR is opened, reopened, or commits are pushed (same-repo PRs only). Skips if pi[bot] is pushing (prevents auto-fix loops).

**What happens:**
1. Posts 👀 to indicate review is running
2. Checks out PR at head SHA, runs manifest to generate scoped diffs per reviewer type
3. Runs multi-agent review via `ai-pr-review-run.sh` (`opencode/claude-sonnet-4-6`) - security, code quality, frontend, design, infrastructure reviewers in parallel
4. Posts verdict comment (✅ / ⚠️ / ❌) with findings
5. If `DO_NOT_PUSH` and fix iterations < 3 → dispatches `repository_dispatch: pr-review-needs-fix`
6. If `DO_NOT_PUSH` and 3 iterations already attempted → labels PR `ai-review-needs-human`

**Concurrency:** Cancels any in-progress review for the same PR number when a new push arrives. Human pushes trigger a new review; pi[bot] auto-fix pushes skip review to prevent loops.

### AI PR Review - Auto Fix (`ai-pr-review-respond` workflow)

**When:** `repository_dispatch: pr-review-needs-fix` event (dispatched by `ai-pr-review.yml`).

**What happens:**
1. Validates `client_payload` inputs (PR number numeric, branch name safe)
2. Posts 🔨 working indicator
3. Adds `ai-fix-iter-N` label to track iteration count
4. Runs `ai-pr-review-fix.sh` (`deepseek-v4-pro`) - fetches latest review comment, fixes CRITICAL/HIGH issues, commits
5. Pushes to branch (this triggers `pull_request:synchronize`, re-running `ai-pr-review.yml`)
6. Posts ✅ on success, ❌ on failure, ⚠️ if no changes produced

### AI PR Merged - Auto-cleanup (`ai-pr-merged` workflow)

**When:** An AI-generated PR (branch starts with `ai/issue-`) is merged.

**What happens:**
1. Closes the linked issue automatically
2. Destroys the ephemeral preview environment (Terraform destroy)
3. Marks the GitHub deployment as inactive

### Destroy Preview Environment - Manual (`destroy-preview-manual` workflow)

**When:** Triggered manually via GitHub Actions UI (repo owner).

**What happens:**
1. Optionally provide a PR number to destroy a specific preview, or leave empty to destroy all preview environments
2. Discovers PR numbers from Terraform state in S3 (if none specified)
3. Destroys the preview environment(s) and marks deployment(s) inactive
4. Useful if PR is abandoned, preview needs early cleanup, or full cleanup is needed

### AI Blog Improvement Radar (`ai-blog-suggestions` workflow)

**When:** On a schedule (1st of month at 08:00 UTC) or manually triggered.

**What happens:**
1. Installs web dependencies and OpenCode tooling
2. Ensures `blog-radar` label exists on the repo
3. Runs `scripts/ai-blog-suggestions.sh`, which:
   - Passes `blog-improvement-radar.md` prompt to `deepseek-v4-pro`
   - Researches competitor blogs, design trends, and web technology
   - Reads codebase to identify concrete gaps across 4 domains
   - Generates 8-15 prioritized, independently actionable suggestions
   - Validates output format and suggestion count
4. Creates or updates a GitHub issue with title "Blog Improvement Radar - [Month Year]" and `blog-radar` label
5. Outputs issue number and suggestion count to GitHub Actions

**Research scope:** Competitor technical blogs (overreacted.io, joshwcomeau.com, leeerob.io, etc.), 2026 design trends, Next.js/React ecosystem, performance optimization, MDX content layer.

**Domains covered:** Features, Design & UX, Infrastructure, DX & Workflow. Content strategy suggestions are deferred to the content repo.

**Why:** Monthly automated competitive + trend analysis keeps the blog evolving with current best practices without manual research time.

### Configuration

- **`.pi/settings.ci.json`** - CI-specific pi settings: uses `deepseek-v4-pro` by default, enables `pi-lens` and `pi-multiagent` extensions
- **`.pi/prompts/`** - Workflow prompt templates (versioned in Langfuse):
  - `ai-issue-implement.md` - issue implementation instructions
  - `ai-pr-respond.md` - PR comment response instructions
  - `ai-pr-review.md` - multi-agent code review (security, code-quality, frontend, design, infra)
  - `blog-improvement-radar.md` - blog strategy analysis & suggestion generation
  - **After editing prompts:** Run `pnpm prompts:push` to sync to Langfuse for tracing and version management
- **`infrastructure/stacks/site/ephemeral/`** - Terraform for ephemeral preview environments:
  - `main.tf` - Cloudflare R2 bucket, custom domain, Workers Basic Auth
  - `variables.tf` - PR number, Cloudflare credentials, Basic Auth credentials

### Scripts

| Script | Purpose |
|--------|---------|
| `scripts/ai-implement.sh` | Issue implementation + criteria check loop + PR creation + summary |
| `scripts/ai-criteria-check.sh` | Deterministic gate: build, typecheck, test coverage, console.log scan, secret pattern scan |
| `scripts/ai-pr-review-run.sh` | Runs manifest + multi-agent review (`claude-sonnet-4-6`), posts verdict to PR |
| `scripts/ai-pr-review-fix.sh` | Fetches latest review comment, runs deepseek-v4-pro to fix CRITICAL/HIGH findings |
| `scripts/ai-respond.sh` | Respond to PR comments with `@ai <instruction>` |
| `scripts/ai-generate-tests.sh` | Generates Playwright E2E tests from issue description using `deepseek-v4-pro` |
| `scripts/ai-eval-trends.sh` | Computes aggregated eval trends and writes trend summary |
| `scripts/ai-blog-suggestions.sh` | Monthly blog improvement radar - research, generate, and issue creation |
| `scripts/generate-pr.sh` | Supports `--draft` flag and CI mode |

### Infrastructure - Ephemeral Preview Environments

Each AI-generated PR gets an ephemeral preview environment for live testing:

- **R2 Bucket:** auto-created, ephemeral (no `prevent_destroy`)
- **Domain:** `pr-{number}.staging.jamesmiller.blog` - custom domain via Cloudflare
- **Auth:** Basic Auth via Cloudflare Workers (same credentials as staging)
- **Lifecycle:** Created when PR is created, destroyed when PR is merged (or manually via destroy-preview-manual workflow)

### Playwright Configuration

Updated for CI preview testing:

- `PLAYWRIGHT_BASE_URL` env var - if set, tests target remote preview instead of localhost
- `PLAYWRIGHT_BASIC_AUTH_USERNAME` & `PLAYWRIGHT_BASIC_AUTH_PASSWORD` env vars - auto-submitted for preview auth
- `CI=true` captures video/screenshots on failure, used by test report artifact

---

## Commit & Push Workflow

### Committing

```bash
git commit -m "your message"
```

The pre-commit hook runs automatically:
1. Lint, typecheck, format check
2. AI docs update - reads the staged diff and surgically edits `AGENTS.md`, `CLAUDE.md`, and files under `.agents/skills/` and `.claude/agents/` to reflect what changed. Any updated doc files are staged and included in the commit.

To skip the docs update (e.g. for a quick WIP commit):

```bash
SKIP_DOCS_UPDATE=1 git commit -m "wip"
```

### Pushing

Push to your branch:

```bash
git push
```

The pre-push hook runs a local `gitleaks` scan when available, then tests. For public PRs, create a pull request on GitHub - the `ai-pr-review.yml` workflow will automatically run a multi-agent review on your diff.

### Automated PR Review

When you open or update a PR, `ai-pr-review.yml` triggers automatically:

1. **Posts 👀** to indicate review is running
2. **Generates scoped diffs** per reviewer category
3. **Runs multi-agent review** - security, code-quality, frontend, design, infrastructure reviewers in parallel via `claude-sonnet-4-6`
4. **Posts verdict** (✅ / ⚠️ / ❌) with findings
5. **Auto-fix loop** - if findings are fixable and iterations < 3, dispatches `ai-pr-review-respond.yml` to auto-fix and re-review

### Critical vulnerability handling

If a critical issue is found, the reviewer states the severity label only - it does not publish exploit details. It will advise resolving it before merging and direct you to open a private advisory via `.github/SECURITY.md`.

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
| `.agents/skills/` | Shared skill specs - design, frontend, infra, security | Both (pi: auto-discovered, Claude: configured in settings) |
| `.claude/agents/` | Claude agent definitions | Claude Code only |

---

## Decision Guide

| Situation | Reach for |
|-----------|-----------|
| Normal development | Claude Code |
| Claude usage exhausted | `pnpm pi` |
| Want a different model | pi → `/model` to switch provider |
| Need multi-agent review | Open a PR - `ai-pr-review.yml` runs automatically |
| Quick lookup | `pnpm pi -p "find..."` |

---

## Reference

### Config files

```
├── AGENTS.md             # Shared project context (all tools read this)
├── CLAUDE.md             # Claude Code entry point (symlink to AGENTS.md)
├── .agents/skills/       # Shared skill definitions (auto-loaded by both)
├── .ai-evals/             # Quality gate thresholds, run data schema, trends script
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
pnpm council             # Council of agents
bash scripts/claude.sh --resume    # Resume most recent Claude container
bash scripts/pi.sh --resume        # Resume most recent pi container
pi -p "query"            # One-shot prompt with pi
pi --model google        # Start pi with specific provider
```

### Docker

Both AI tools run inside Docker with the repo mounted at `/workspace`. See `docs/DOCKER.md` for details on volumes, credentials, and worktree support.
