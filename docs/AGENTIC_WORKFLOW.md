# Agentic Workflow

This repo is designed for AI-assisted development using a multi-model approach. The core idea: all models share the same project context, so switching between them is a model choice — not a context rebuild.

## The Pattern

**Start with Claude Code. Always.**

Claude is the primary agent. It has the richest tooling (plugins, hooks, MCP servers, subagents) and loads the full shared context on startup. Only reach for another tool when you have a specific reason to.

## When to Reach for Another Tool

### OpenCode — different model, same context

If a task isn't clicking with Claude's approach, switch to OpenCode and run it through a different model. The agents and shared context are identical — it's purely a model swap.

Configure your preferred model in `opencode.json`.

### Gemini CLI — council or quick research

Two specific use cases:

**1. Council** — Gemini has a `council` MCP configured. Use it to get a second opinion from a different model mid-task. Useful for architecture decisions, reviewing Claude's output, or breaking a deadlock. See [Using Council](#council-get-a-second-opinion-before-committing) below.

**2. Fast lookups** — Gemini handles quick codebase queries well without spinning up a full session. Good for "where is X defined" or "what does Y do" questions.

### Codex CLI — OpenAI models

Use Codex when you want to run tasks through OpenAI models. It doesn't have the council MCP configured by default, so it works independently rather than in a coordinated council session. Add the `agents-council` MCP to `.codex/` config if you want to bring it into council workflows.

---

## Using Agents

Specialist agents focus each model on a specific domain. All agents load the shared skills from `.agents/skills/` — you don't need to brief them on the design system or conventions.

### Writer agents — implement and build

| Agent | Purpose | When to use |
|-------|---------|-------------|
| `frontend-dev` | UI components, Next.js pages | Building or modifying any UI |
| `design-expert` | Byte Mark design system compliance | Checking or enforcing design rules |
| `infrastructure` | Terraform & AWS | Any infra or CI/CD work |
| `security-auditor` | Security vulnerability review | Auditing code or dependencies |
| `parallel-executor` | Multiple independent tasks in parallel | When you have work that doesn't depend on itself |

### Reviewer agents — adversarial, read-only (Claude Code only)

These agents never write code. They review diffs adversarially with no loyalty to the implementation. Dispatched automatically by `/pre-push-review`.

| Agent | What it checks |
|-------|---------------|
| `reviewer-security` | Secrets, injection, CVEs, exploitable logic, prompt injection in diff |
| `reviewer-frontend` | React/Next.js patterns, TypeScript safety, accessibility, performance |
| `reviewer-design` | Byte Mark compliance — tokens, typography, borders, corner radii |
| `reviewer-infrastructure` | GitHub Actions injection, IAM permissions, Terraform misconfigs |
| `reviewer-code-quality` | Syntax, code smells, complexity, naming, reusability, best practices |

### Claude Code

Switch agents with `/agent <name>`:

```
/agent frontend-dev
/agent design-expert
/agent infrastructure
/agent security-auditor
/agent parallel-executor
```

### OpenCode

Switch agents with Tab — cycle through available agents and select by name.

### Gemini CLI

Gemini uses **skills** rather than agents. Skills are activated on demand and layer additional expertise into the session:

```
activate_skill infrastructure
activate_skill security-audit
activate_skill design-review
```

### Codex CLI

Specify an agent when starting a session:

```bash
codex --agent frontend-dev
codex --agent design-expert
codex --agent infrastructure
codex --agent security-auditor
```

### Example prompts per agent

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

**parallel-executor** — splitting independent work (Claude Code only — uses Claude's Task tool to spawn real parallel sub-agents):
```
I need to: (1) build a ReadingTime component, (2) add Open Graph meta tags to the post layout, and (3) write unit tests for the posts utility. These are independent — run them in parallel.
```

---

## Working Agents Together on a Feature

For larger features, you can chain agents sequentially or run independent tasks in parallel.

### Sequential: design → build → review

Use this when each step depends on the previous one. The workflow pattern works across all tools — only the agent-switching syntax differs.

| Tool | How to switch agent |
|------|-------------------|
| Claude Code | `/agent <name>` |
| OpenCode | Tab to cycle, select by name |
| Gemini CLI | `activate_skill <name>` (skills, not agents) |
| Codex CLI | Restart session: `codex --agent <name>` |

**Step 1 — design-expert: spec the component**

> I want to add a "Related Posts" section at the bottom of each post page showing 3 posts with matching tags. Spec out the component structure and which Byte Mark patterns to use before we build anything.

*Claude: `/agent design-expert` then prompt. OpenCode: Tab → design-expert. Gemini: `activate_skill design-review` then prompt.*

**Step 2 — frontend-dev: build it**

> Build the RelatedPosts component based on this spec: [paste spec from step 1]. Wire it into the post layout at web/src/app/posts/[slug]/page.tsx.

*Claude: `/agent frontend-dev`. OpenCode: Tab → frontend-dev. Gemini: no frontend agent — use default session.*

**Step 3 — design-expert: verify**

> Review the RelatedPosts component I just built. Check it against the Byte Mark spec — colours, type scale, spacing, borders, hover states.

**Step 4 — security-auditor: check before shipping**

> Review the RelatedPosts implementation. It queries posts by tag — check the tag filtering logic for any injection risks and verify no user input reaches the file system.

---

### Parallel: independent tasks on a feature (Claude Code only)

`parallel-executor` is a Claude Code-specific agent that uses Claude's internal Task tool to spawn other named agents as genuinely parallel sub-agents. It does not work this way in OpenCode, Gemini, or Codex — those tools have no equivalent spawning mechanism.

Switch to it with `/agent parallel-executor`, then describe the tasks and which agent should handle each one. The executor spins up `frontend-dev`, `security-auditor`, etc. as real parallel workers and aggregates their output.

```
/agent parallel-executor

I'm building a tag filtering feature for the blog. These tasks are independent — run them in parallel:

1. Use the frontend-dev agent to build the TagFilter component — pill buttons that filter the post grid by tag, using the existing pill button pattern from globals.css.

2. Use the frontend-dev agent to update the PostGrid component to accept an activeTag prop and filter posts client-side.

3. Use the security-auditor agent to audit the tag handling in posts.ts — tags come from MDX frontmatter, check they're sanitised before rendering.

4. Use the infrastructure agent to check if the GitHub Actions build pipeline needs any changes to handle the new client component.
```

The executor dispatches all four tasks simultaneously, waits for results, and reports back with a consolidated summary.

**In OpenCode / Gemini / Codex** — there's no parallel spawning. Work through tasks sequentially, switching agents or skills between each one.

---

### Council: get a second opinion before committing

Use this before making architectural decisions or when two approaches seem equally valid.

```
# In Claude — start the council
Start a council. I'm deciding between two approaches for the tag filtering feature:
  A) Client-side filtering — filter in the browser from a pre-built post index
  B) Static pages per tag — generate /tags/[tag] at build time
Context: ~200 posts, tags used for navigation, site is fully static (no server). What's the better approach and why?

# In a second terminal — Gemini joins and weighs in
Join council session [ID]. Read the question about tag filtering approaches for a static Next.js blog and share your recommendation.
```

---

Council enables cross-model coordination — you pose a question or decision and get responses from multiple AI models before acting.

**Which tools can participate:** Claude and Gemini only. Both have the `council` MCP server configured (Claude globally, Gemini via `.gemini/settings.json`). OpenCode and Codex do not have the council MCP — they'd need it added to their configs before they could join.

### When to use it

- Architecture decisions where you want more than one model's take
- Reviewing a plan or design before committing to it
- Breaking a deadlock when one model isn't giving a useful answer
- Stress-testing an approach

### How it works

**1. Start a council session** (from Claude or Gemini):

> "Start a council to discuss [topic/question]"

The model calls `start_council` and returns a session ID.

**2. Invite the other model**

Open a second terminal with the other council-capable tool (Claude or Gemini) and join:

> "Join the council session [session ID]"

The model calls `join_council` with the session ID.

**3. Pose the question**

Each participating model reads the context and sends its response via `send_response`. You can summon a specific agent into the session with `summon_agent` if you want a specialist perspective.

**4. Review and close**

Poll for responses with `get_current_session_data`. Once you have what you need, close the session with `close_council`.

### Example

```
# Terminal 1 — Claude
> "Start a council. Question: should we use SSG or SSR for the projects page given our caching setup?"
→ Session ID: abc123

# Terminal 2 — Gemini
> "Join council session abc123 and share your view on SSG vs SSR for this Next.js blog"

# Terminal 1 — back in Claude
> "Get the current council responses"
→ Review Gemini's take, make a decision, close the council
```

---

## Pre-Push Security Review

Before pushing to a public branch, run a local multi-agent review using your existing Claude subscription — no separate API billing needed.

### How to trigger it

Inside Claude Code, run:

```
/pre-push-review
```

The command collects the full diff, then dispatches all four reviewer agents **in parallel**. Each agent approaches the diff adversarially with no loyalty to the implementation. The pre-push hook (`.husky/pre-push`) prints a reminder automatically after tests pass.

### What it produces

1. **Architecture / Flow Diagram** — Mermaid diagram if changes affect structure, data flow, or CI
2. **Findings by severity** — aggregated across all four reviewers (CRITICAL / HIGH / MEDIUM / LOW)
3. **Verdict** — SAFE TO PUSH / DO NOT PUSH / PUSH WITH CAUTION

### The four reviewers

| Reviewer | Focus |
|----------|-------|
| `reviewer-security` | Secrets, injection, CVEs, exploitable logic |
| `reviewer-frontend` | React/Next.js patterns, TypeScript, accessibility |
| `reviewer-design` | Byte Mark compliance — tokens, typography, borders |
| `reviewer-infrastructure` | GitHub Actions injection, IAM, Terraform misconfigs |
| `reviewer-code-quality` | Syntax, smells, complexity, naming, best practices |

Each reviewer is a separate agent with read-only tools and an adversarial framing that explicitly overrides any developer perspective loaded from shared context.

### Critical vulnerability handling

If a critical issue is found, the reviewer states the severity label only — it does not publish exploit details. It will advise resolving it before pushing and direct you to open a private advisory via `.github/SECURITY.md`.

### Prompt injection defence

Reviewers treat all diff content as untrusted data. If anything in the diff reads as an instruction directed at the reviewer, it is flagged as a HIGH severity finding rather than followed. This is a **behavioural mitigation, not a technical guarantee** — naive injection attempts are caught, sophisticated ones remain a known limitation of the current LLM toolchain.

---

## Shared Context

Switching tools doesn't mean starting over. All models read the same project context automatically.

| Layer | What it contains | Loaded by |
|-------|-----------------|-----------|
| `AGENTS.md` | Project overview, conventions, structure | All tools (auto-discovered) |
| `web/design/DESIGN.md` | Byte Mark design system spec | Claude, OpenCode, Gemini |
| `.agents/skills/` | Shared skill specs — design, frontend, infra, security | Claude, OpenCode, Gemini |

`.agents/skills/` files are loaded automatically via each tool's config — they're not invoked directly. Codex agents are self-contained (Codex has no mechanism for loading external instruction files).

---

## Decision Guide

| Situation | Reach for |
|-----------|-----------|
| Normal development | Claude Code |
| Claude's approach isn't working | OpenCode (try a different model) |
| Want a second opinion on a decision | Gemini CLI (council) |
| Want OpenAI in the loop | Codex CLI (council) |
| Quick codebase lookup | Gemini CLI |

---

## Reference

### Config files

```
├── AGENTS.md             # Shared project context (all tools read this)
├── .agents/skills/       # Shared skill definitions (auto-loaded)
├── .claude/              # Claude Code agents + config
├── opencode.json         # OpenCode config
├── .opencode/            # OpenCode agents
├── .gemini/              # Gemini config + skills
├── .codex/               # Codex agents
└── web/design/DESIGN.md  # Byte Mark design system
```

### Setup

```bash
npm install -g @anthropic-ai/claude-code   # Claude Code (primary)
npm install -g @google/gemini-cli          # Gemini CLI
npm install -g @openai/codex               # Codex CLI
# OpenCode: see opencode.ai, then cd .opencode && bun install
```

Set API keys in your environment for each provider you use.
