#!/bin/bash

# Source .envrc for non-interactive shells (git hooks) where direnv hasn't loaded it
if [ -z "${CI:-}" ] && [ -f .envrc ]; then
	set -a
	source .envrc
	set +a
fi

printf '\033[1;36m▶ Notifications: https://ntfy.sh/%s\033[0m\n' "$NTFY_TOPIC" >&2
printf '\033[0;33m  Tip: use pnpm claude:fresh if Dockerfile or deps changed\033[0m\n' >&2

cleanup() {
	docker compose down --timeout 3 2>/dev/null || true
}
trap cleanup EXIT INT TERM HUP

VOL_OPTS=()
if [ -n "$BLOG_GIT_DIR" ]; then
	BLOG_GIT_DIR=$(realpath "$BLOG_GIT_DIR") || {
		echo "Error: BLOG_GIT_DIR is not a valid path: $BLOG_GIT_DIR" >&2
		exit 1
	}
	VOL_OPTS+=(-v "$BLOG_GIT_DIR:$BLOG_GIT_DIR:ro")
fi

if [ -t 0 ]; then
	# Interactive: stdin is a TTY — docker allocates a natural PTY
	docker compose run --rm "${VOL_OPTS[@]}" claude --dangerously-skip-permissions "$@"
else
	# Non-interactive (git hooks, piped prompt, CI): -T disables PTY allocation.
	# This lets stdin flow cleanly from a file/pipe without any echo or PTY line-discipline corruption.
	docker compose run --rm -T "${VOL_OPTS[@]}" claude --dangerously-skip-permissions "$@"
fi
