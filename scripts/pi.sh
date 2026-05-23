#!/bin/bash
printf '\033[1;36m▶ pi — AI coding assistant\033[0m\n'
printf '\033[0;33m  Tip: use pnpm pi:fresh if Dockerfile.pi or deps changed\033[0m\n'

OPTS=()

# Mount the main git directory so worktree .git pointers resolve inside Docker.
GIT_COMMON_DIR=$(git rev-parse --git-common-dir 2>/dev/null)
if [ -n "$GIT_COMMON_DIR" ]; then
	GIT_COMMON_DIR=$(realpath "$GIT_COMMON_DIR")
	OPTS+=(-v "$GIT_COMMON_DIR:$GIT_COMMON_DIR:ro")
fi

# Legacy: also mount BLOG_GIT_DIR if set (used by the content repo).
if [ -n "$BLOG_GIT_DIR" ]; then
	BLOG_GIT_DIR=$(realpath "$BLOG_GIT_DIR") || {
		echo "Error: BLOG_GIT_DIR is not a valid path: $BLOG_GIT_DIR"
		exit 1
	}
	OPTS+=(-v "$BLOG_GIT_DIR:$BLOG_GIT_DIR:ro")
fi

docker compose run --rm "${OPTS[@]}" pi --agent-team-subagent-skills disabled "$@"
