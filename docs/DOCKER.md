# Running Claude in Docker

Runs Claude Code with `--dangerously-skip-permissions` (no prompts, full tool access) inside a sandboxed container. Claude can only reach `/workspace` (repo mount) and `/home/claude` (named volume). Non-root `claude` user adds a second layer.

## Usage

```bash
docker compose up                                          # interactive session
docker compose run --rm claude                            # one-off, no persist
ANTHROPIC_MODEL=claude-opus-4-7 docker compose run --rm claude  # override model
```

Default model: `claude-sonnet-4-6` (set in `docker-compose.yml`).

## Persistence

`claude-home` named volume persists `~/.claude/settings.json` and `~/.claude/projects/` (memory, preferences) across restarts. Repo changes are live in both directions.

## API Key

```bash
export ANTHROPIC_API_KEY=sk-ant-...
docker compose up
```

Compose inherits from host env. Do not add to `docker-compose.yml` — it's committed.
