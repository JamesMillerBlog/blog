# Running Claude in Docker

Runs Claude Code with `--dangerously-skip-permissions` (no prompts, full tool access) inside a sandboxed container. Claude can only reach `/workspace` (repo mount) and `/home/claude` (named volume). Non-root `claude` user adds a second layer.

**Trust model:** `docker/claude-settings.json` grants `Bash(*)` with no restrictions — arbitrary command execution inside the container is intentional for an AI coding agent. The container boundary is the primary isolation. Do not mount sensitive host paths or directories outside the repo.

**Known limitation:** The pre-commit hook passes `$DIFF` content to Claude with `--allowedTools` restricted, but staged content is developer-controlled and can contain adversarial text. This is an architectural constraint of LLM-based git hooks, not a configuration error.

## Usage

```bash
docker compose up                                          # interactive session
docker compose run --rm claude                            # one-off, no persist
ANTHROPIC_MODEL=claude-opus-4-7 docker compose run --rm claude  # override model
```

Default model: `claude-sonnet-4-6` (set in `docker-compose.yml`).

## Git Worktrees

When running inside a git worktree, set `$BLOG_GIT_DIR` to the main repo's `.git` directory so the container can access the full git history:

```bash
BLOG_GIT_DIR=$(git rev-parse --git-common-dir) pnpm claude
```

`pnpm claude` mounts it read-only when the variable is set.

## Persistence

`claude-home` named volume persists `~/.claude/projects/` (memory) across restarts. The image ships a default `~/.claude/settings.json` baked in at build time from `docker/claude-settings.json`; the named volume can override it if a `settings.json` exists there. Repo changes are live in both directions.

## API Key

```bash
export ANTHROPIC_API_KEY=sk-ant-...
docker compose up
```

Compose inherits from host env. Do not add to `docker-compose.yml` — it's committed.
