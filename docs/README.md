# Documentation

Welcome to the blog frontend/infrastructure documentation.

## Content Workflow

Content-related docs (SEO, social automation, skills) have moved to the `blog-content` repository where they belong. See `blog-content/docs/`.

## Documentation Index

| Document                                                   | Description                                                       |
| ---------------------------------------------------------- | ----------------------------------------------------------------- |
| [AWS Infrastructure & Deployment](./AWS_INFRASTRUCTURE.md) | Terraform layout, content split, and AWS deployment workflows.     |
| [GIT_WORKTREES.md](./GIT_WORKTREES.md)                     | Working on multiple branches and worktrees.                        |
| [AGENTIC_WORKFLOW.md](./AGENTIC_WORKFLOW.md)               | Notes on using multiple AI tools in the workflow.                  |
| [DOCKER.md](./DOCKER.md)                                   | Running Claude Code or pi in a Docker container — why and how.      |
| [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)                   | Manual security findings beyond automated scanning (structural concerns). |

## Key Files in Project Root

| File                    | Purpose                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| `AGENTS.md`             | Cross-tool project instructions                                                                  |
| `.claude/agents/`       | Claude agents (frontend-dev, design-expert, infrastructure, security-auditor, parallel-executor) |
| `.claude/settings.json` | MCP servers and hooks configuration                                                              |
| `.pi/settings.json`     | pi project configuration (provider, skills, model cycling)                                       |
| `.agents/skills/`       | Shared skills used by all AI tools                                                               |
| `web/design/DESIGN.md`  | Byte Mark design system                                                                          |

## Getting Help

Ask Claude:

```
How does the blog-content repo publish posts?
How do the shared and site Terraform stacks relate?
How do I upload new assets to the assets CDN?
```

Or check the specific documentation above.
