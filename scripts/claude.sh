#!/bin/bash
# Source .envrc for non-interactive shells (git hooks) where direnv hasn't loaded it
if [ -z "${CI:-}" ] && [ -f .envrc ]; then
	set -a
	source .envrc
	set +a
fi

printf '\033[1;36m▶ Notifications: https://ntfy.sh/%s\033[0m\n' "$NTFY_TOPIC" >&2
printf '\033[0;33m  Tip: use pnpm claude:fresh if Dockerfile or deps changed\033[0m\n' >&2

DOCKER_OPTS=()
[ ! -t 0 ] && DOCKER_OPTS+=(-T)

DOCKER_CMD=(docker compose run --rm "${DOCKER_OPTS[@]}")
if [ -n "$BLOG_GIT_DIR" ]; then
	BLOG_GIT_DIR=$(realpath "$BLOG_GIT_DIR") || {
		echo "Error: BLOG_GIT_DIR is not a valid path: $BLOG_GIT_DIR" >&2
		exit 1
	}
	DOCKER_CMD+=(-v "$BLOG_GIT_DIR:$BLOG_GIT_DIR:ro")
fi
DOCKER_CMD+=(claude --dangerously-skip-permissions "$@")

exec "${DOCKER_CMD[@]}"
