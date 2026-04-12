# Documentation

Welcome to the blog frontend/infrastructure documentation.

## Content Workflow

Content-related docs (SEO, social automation, skills) have moved to the `blog-content` repository where they belong. See `blog-content/docs/`.

## Quick Start (Frontend)

1. **First time?** Read [WORKFLOW.md](./WORKFLOW.md)
2. **Setting up integrations?** Read [MCP_SERVERS.md](./MCP_SERVERS.md)

## Documentation Index

| Document                               | Description                                             |
| -------------------------------------- | ------------------------------------------------------- |
| [AGENTIC_WORKFLOW.md](./AGENTIC_WORKFLOW.md) | Multi-model agentic workflow — when and how to use each tool |
| [MCP_SERVERS.md](./MCP_SERVERS.md)     | Connecting Claude to external tools                     |
| [HOOKS.md](./HOOKS.md)                 | Automating tasks on events                              |
| [GIT_WORKTREES.md](./GIT_WORKTREES.md) | Working on multiple branches                            |
| [WORKFLOW.md](./WORKFLOW.md)           | Daily/weekly workflows                                  |

## Key Files in Project Root

| File                    | Purpose                             |
| ----------------------- | ----------------------------------- |
| `opencode.json`         | OpenCode configuration              |
| `.opencode/`            | OpenCode agents and docs            |
| `AGENTS.md`             | Cross-tool project instructions     |
| `.claude/agents/`       | Claude agents (frontend-dev, design-expert, infrastructure, security-auditor, parallel-executor) |
| `.claude/settings.json` | MCP servers and hooks configuration |
| `web/design/DESIGN.md`  | Byte Mark design system             |

## Getting Help

Ask Claude:

```
How do I create a new component?
What MCP servers are available?
Help me set up hooks
```

Or check the specific documentation above.
