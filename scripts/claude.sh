#!/bin/bash
WORKTREE_ROOT=$(pwd)
WT_NAME=$(basename "$WORKTREE_ROOT" | tr -cd '[:alnum:]._-')
CONTAINER_BASE="claude-${WT_NAME}"

if [[ "${1:-}" == "--fresh" ]]; then
  shift
  CONTAINER="$CONTAINER_BASE"
  INSTANCE=1
  docker rm -f "$CONTAINER" 2>/dev/null || true
  docker compose build claude
else
  # Find a container slot that isn't currently running
  CONTAINER="$CONTAINER_BASE"
  INSTANCE=1
  COUNTER=2
  while [ "$(docker inspect "$CONTAINER" --format '{{.State.Status}}' 2>/dev/null || echo 'missing')" = "running" ]; do
    INSTANCE=$COUNTER
    CONTAINER="${CONTAINER_BASE}-${COUNTER}"
    ((COUNTER++))
  done
fi

if [ -n "${HERDR_PANE_ID:-}" ] && command -v herdr &>/dev/null; then
  DISPLAY_NAME="claude · $WT_NAME"
  [ "$INSTANCE" -gt 1 ] && DISPLAY_NAME="$DISPLAY_NAME · #$INSTANCE"
  herdr pane report-metadata "$HERDR_PANE_ID" --display-agent "$DISPLAY_NAME" 2>/dev/null || true
fi

EXTRA_OPTS=()
GIT_COMMON_DIR=$(git rev-parse --git-common-dir 2>/dev/null) || true
if [ -n "${GIT_COMMON_DIR:-}" ]; then
  GIT_COMMON_DIR=$(realpath "$GIT_COMMON_DIR")
  EXTRA_OPTS+=(--volume "$GIT_COMMON_DIR:$GIT_COMMON_DIR:ro")
fi
if [ -n "${BLOG_GIT_DIR:-}" ]; then
  BLOG_GIT_DIR=$(realpath "$BLOG_GIT_DIR") || {
    echo "Error: BLOG_GIT_DIR is not a valid path: $BLOG_GIT_DIR"
    exit 1
  }
  EXTRA_OPTS+=(--volume "$BLOG_GIT_DIR:$BLOG_GIT_DIR:ro")
fi

if [ -n "${HERDR_SOCKET_PATH:-}" ] && [ -S "$HERDR_SOCKET_PATH" ]; then
  EXTRA_OPTS+=(--volume "$HERDR_SOCKET_PATH:$HERDR_SOCKET_PATH")
fi

if [ -t 0 ]; then
  # Interactive session: reuse named container
  printf '\033[0;33m  Tip: use pnpm claude:fresh if Dockerfile.claude or deps changed\033[0m\n'
  STATUS=$(docker inspect "$CONTAINER" --format '{{.State.Status}}' 2>/dev/null || echo "missing")
  case "$STATUS" in
  exited | created | paused)
    if [ $# -gt 0 ]; then
      # Args can't be forwarded to docker start — run one-shot and auto-remove
      docker rm "$CONTAINER" 2>/dev/null || true
      printf '\033[0;33mStarting container: %s\033[0m\n' "$CONTAINER"
      docker compose run --rm "${EXTRA_OPTS[@]}" claude "$@"
    else
      printf '\033[0;33mResuming container: %s\033[0m\n' "$CONTAINER"
      docker start -ai "$CONTAINER"
    fi
    ;;
  *)
    printf '\033[0;33mStarting container: %s\033[0m\n' "$CONTAINER"
    docker compose run --name "$CONTAINER" "${EXTRA_OPTS[@]}" claude "$@"
    ;;
  esac
else
  # Non-interactive (piped, git hook, CI): one-shot container, no TTY
  docker compose run --rm -T "${EXTRA_OPTS[@]}" claude "$@"
fi
