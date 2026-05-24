#!/bin/bash
set -euo pipefail

# Source .envrc for non-interactive shells (git hooks) where direnv hasn't loaded it
if [ -z "${CI:-}" ] && [ -f .envrc ]; then
	set -a
	source .envrc
	set +a
fi

# Create pi permission system config for Docker (yoloMode safe inside container sandbox)
mkdir -p .pi/extensions/pi-permission-system
echo '{"yoloMode": true}' >.pi/extensions/pi-permission-system/config.json

printf '\033[1;36m▶ pi — AI coding assistant\033[0m\n' >&2
printf '\033[0;33m  Tip: use pnpm pi:fresh if Dockerfile.pi or deps changed\033[0m\n' >&2

cleanup() {
	docker compose down --timeout 3 2>/dev/null || true
}
trap cleanup EXIT INT TERM

OPTS=()

# Mount the main git directory so worktree .git pointers resolve inside Docker.
GIT_COMMON_DIR=$(git rev-parse --git-common-dir 2>/dev/null) || true
if [ -n "$GIT_COMMON_DIR" ]; then
	GIT_COMMON_DIR=$(realpath "$GIT_COMMON_DIR")
	OPTS+=(-v "$GIT_COMMON_DIR:$GIT_COMMON_DIR:ro")
fi

# Legacy: also mount BLOG_GIT_DIR if set (used by the content repo).
if [ -n "${BLOG_GIT_DIR:-}" ]; then
	BLOG_GIT_DIR=$(realpath "$BLOG_GIT_DIR") || {
		echo "Error: BLOG_GIT_DIR is not a valid path: $BLOG_GIT_DIR" >&2
		exit 1
	}
	OPTS+=(-v "$BLOG_GIT_DIR:$BLOG_GIT_DIR:ro")
fi

if [ -t 0 ]; then
	# Interactive: stdin is a TTY — docker allocates a natural PTY
	docker compose run --rm "${OPTS[@]}" pi --agent-team-subagent-skills disabled "$@"
else
	# Non-interactive (git hooks, piped prompt, CI): -T lets stdin flow cleanly without echo
	docker compose run --rm -T "${OPTS[@]}" pi --agent-team-subagent-skills disabled "$@"
fi
