#!/bin/bash
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
WT_NAME=$(basename "$REPO_ROOT" | tr -cd '[:alnum:]._-')
CONTAINER="claude-${WT_NAME}"

if [[ "${1:-}" == "--fresh" ]]; then
  shift
  docker rm -f "$CONTAINER" 2>/dev/null || true
  docker compose build claude
fi

EXTRA_OPTS=()
if [ -n "${BLOG_GIT_DIR:-}" ]; then
  BLOG_GIT_DIR=$(realpath "$BLOG_GIT_DIR") || {
    echo "Error: BLOG_GIT_DIR is not a valid path: $BLOG_GIT_DIR"
    exit 1
  }
  EXTRA_OPTS+=(--volume "$BLOG_GIT_DIR:$BLOG_GIT_DIR:ro")
fi

if [ -t 0 ]; then
  # Interactive session: reuse named container
  printf '\033[0;33m  Tip: use pnpm claude:fresh if Dockerfile.claude or deps changed\033[0m\n'
  STATUS=$(docker inspect "$CONTAINER" --format '{{.State.Status}}' 2>/dev/null || echo "missing")
  case "$STATUS" in
    running)
      printf '\033[0;33mClaude is already running in this worktree — exit that session first.\033[0m\n'
      exit 1
      ;;
    exited|created|paused)
      docker start -ai "$CONTAINER"
      ;;
    *)
      docker compose run --name "$CONTAINER" "${EXTRA_OPTS[@]}" claude "$@"
      ;;
  esac
else
  # Non-interactive (piped, git hook, CI): one-shot container, no TTY
  docker compose run --rm -T "${EXTRA_OPTS[@]}" claude "$@"
fi
