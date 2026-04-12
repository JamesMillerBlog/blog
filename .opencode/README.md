# OpenCode Setup

OpenCode automatically reads `AGENTS.md` from the project root. Shared skills are loaded via `opencode.json`.

## Plugins

Install plugins before first run:

```bash
cd .opencode
bun add opencode-worktree opencode-mystatus opencode-background-agents
```

## Model

Set your preferred model in `opencode.json` using `provider/model-id` format, e.g. `anthropic/claude-sonnet-4-5`.
