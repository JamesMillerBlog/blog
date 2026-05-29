# Running AI Tools in Docker

Two AI coding assistants are available via Docker, both running with full tool access inside a sandboxed container. The container boundary is the primary isolation — neither tool can reach host paths outside `/workspace` (repo mount) and the tool's home directory (`/home/claude` or `/home/pi`).

## Claude Code

Runs Claude with `--dangerously-skip-permissions` (no prompts, full tool access). Claude can only reach `/workspace` and `/home/claude`.

**Trust model:** `docker/claude-settings.json` grants `Bash(*)` with no restrictions — arbitrary command execution inside the container is intentional for an AI coding agent.

**Known limitation:** The pre-commit hook passes `$DIFF` content to Claude with `--allowedTools` restricted, but staged content is developer-controlled and can contain adversarial text. This is an architectural constraint of LLM-based git hooks, not a configuration error.

### Usage

```bash
pnpm claude                              # interactive session
pnpm claude:fresh                        # rebuild image then interactive
ANTHROPIC_MODEL=claude-opus-4-7 pnpm claude  # override model
```

Default model: `claude-sonnet-4-6` (set in `docker-compose.yml`).

## Pi

Runs pi in Docker with the same sandboxed approach. Pi can only reach `/workspace` and `/home/pi`.

### Usage

```bash
pnpm pi                                  # interactive session (default: opencode-go/deepseek-v4-flash)
pnpm pi:fresh                            # rebuild image then interactive
docker compose run --rm pi --model google  # use Gemini model
docker compose run --rm pi -p "list all TypeScript files"  # one-shot prompt
```

Inside pi, use `/model` or Ctrl+L to switch models interactively.

### Available Models

Pi has built-in support for these providers (auth via env vars or `/login` in interactive mode):

| Provider | Auth | Models |
|----------|------|--------|
| OpenCode Go | `OPENCODE_API_KEY` env var | DeepSeek V4 Flash/Pro, Kimi K2.5/2.6, MiniMax M2.5/2.7, GLM |
| Google Gemini | `GEMINI_API_KEY` env var | Gemini 2.5 Pro/Flash |
| OpenAI Codex | `/login openai` (ChatGPT Plus/Pro) | GPT-4o, o-series |
| DeepSeek | `DEEPSEEK_API_KEY` env var | DeepSeek V3, R1 |
| OpenRouter | `OPENROUTER_API_KEY` env var | Many models via routing |

## Git Worktrees

Each worktree can run multiple concurrent Claude or pi sessions. The scripts auto-assign container names to available slots (e.g. `claude-blog-main`, `claude-blog-main-2`, `claude-blog-main-3`), allowing independent AI sessions to run in parallel within the same worktree. Run `pnpm claude:fresh` or `pnpm pi:fresh` to rebuild and start a fresh container.

The scripts auto-detect the shared `.git` directory via `git rev-parse --git-common-dir` and mount it read-only. You can still override with `$BLOG_GIT_DIR` if needed.

## Persistence

Host mounts persist credentials and settings across restarts:
- **Claude:** `${HOME}/.claude/projects` → `/home/claude/.claude/projects`, `${HOME}/.claude/hooks` → `/home/claude/.claude/hooks`, `${HOME}/.claude/.credentials.json` → `/home/claude/.claude/.credentials.json`, `${HOME}/.claude.json` → `/home/claude/.claude.json`, `${HOME}/.config/gh` → `/home/claude/.config/gh`
- **Pi:** `${HOME}/.pi` → `/home/pi/.pi` (settings, auth, sessions), `${HOME}/.config/gh` → `/home/pi/.config/gh`

The images ship default settings at build time; host mounts override them if present. Repo changes are live in both directions.

## API Keys

Set API keys via environment variables (compose inherits from host env):

```bash
export OPENCODE_API_KEY=sk-...
export GEMINI_API_KEY=...
export GH_TOKEN=ghp_...
pnpm pi
```

Do not add keys to `docker-compose.yml` — it's committed to git. (Exception: `GH_TOKEN` already in compose as `${GH_TOKEN:-}`, inheriting from host when set.)
