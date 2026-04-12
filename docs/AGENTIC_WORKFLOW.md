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

**1. Council** — Gemini has a `council` MCP configured. Use it to get a second opinion from a different model mid-task. Useful for architecture decisions, reviewing Claude's output, or breaking a deadlock.

**2. Fast lookups** — Gemini handles quick codebase queries well without spinning up a full session. Good for "where is X defined" or "what does Y do" questions.

### Codex CLI — council with OpenAI models

Same council pattern as Gemini, but brings OpenAI models into the conversation. Use when you want an OpenAI perspective alongside Claude or Gemini.

## Shared Context

Switching tools doesn't mean starting over. All models read the same project context.

| Layer | What it contains | Loaded by |
|-------|-----------------|-----------|
| `AGENTS.md` | Project overview, conventions, structure | All tools (auto-discovered) |
| `web/design/DESIGN.md` | Byte Mark design system spec | Claude, OpenCode, Gemini |
| `.agents/skills/` | Shared skill specs — design, frontend, infra, security | Claude, OpenCode, Gemini |

Codex agents are self-contained (Codex has no mechanism for loading external instruction files).

## Agents

Specialist agents focus each model on a specific domain. Available across Claude and OpenCode; Codex has all except `parallel-executor`.

| Agent | Purpose |
|-------|---------|
| `frontend-dev` | UI components, Next.js pages |
| `design-expert` | Byte Mark design system compliance |
| `infrastructure` | Terraform & AWS |
| `security-auditor` | Security vulnerability review |
| `parallel-executor` | Multiple independent tasks in parallel |

Switch agents in Claude with `/agent <name>`, in OpenCode with Tab.

## Decision Guide

| Situation | Reach for |
|-----------|-----------|
| Normal development | Claude Code |
| Claude's approach isn't working | OpenCode (try a different model) |
| Want a second opinion on a decision | Gemini CLI (council) |
| Want OpenAI in the loop | Codex CLI (council) |
| Quick codebase lookup | Gemini CLI |

## Reference

### Config files

```
├── AGENTS.md             # Shared project context (all tools read this)
├── .agents/skills/       # Shared skill definitions
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
