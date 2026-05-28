#!/bin/bash
set -euo pipefail
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
WT_NAME=$(basename "$REPO_ROOT" | tr -cd '[:alnum:]._-')
CONTAINER="pi-${WT_NAME}"

if [[ "${1:-}" == "--fresh" ]]; then
  shift
  docker rm -f "$CONTAINER" 2>/dev/null || true
  docker compose build pi
fi

mkdir -p .pi/extensions/pi-permission-system
echo '{"yoloMode": true}' >.pi/extensions/pi-permission-system/config.json

OPTS=()
GIT_COMMON_DIR=$(git rev-parse --git-common-dir 2>/dev/null) || true
if [ -n "${GIT_COMMON_DIR:-}" ]; then
  GIT_COMMON_DIR=$(realpath "$GIT_COMMON_DIR")
  OPTS+=(--volume "$GIT_COMMON_DIR:$GIT_COMMON_DIR:ro")
fi
if [ -n "${BLOG_GIT_DIR:-}" ]; then
  BLOG_GIT_DIR=$(realpath "$BLOG_GIT_DIR") || {
    echo "Error: BLOG_GIT_DIR is not a valid path: $BLOG_GIT_DIR"
    exit 1
  }
  OPTS+=(--volume "$BLOG_GIT_DIR:$BLOG_GIT_DIR:ro")
fi

if [ -t 0 ]; then
  # Interactive session: reuse named container
  printf '\033[1;36m▶ pi — AI coding assistant\033[0m\n'
  printf '\033[0;33m  Tip: use pnpm pi:fresh if Dockerfile.pi or deps changed\033[0m\n'
  STATUS=$(docker inspect "$CONTAINER" --format '{{.State.Status}}' 2>/dev/null || echo "missing")
  case "$STATUS" in
    running)
      printf '\033[0;33mpi is already running in this worktree — exit that session first.\033[0m\n'
      exit 1
      ;;
    exited|created|paused)
      docker start -ai "$CONTAINER"
      ;;
    *)
      docker compose run --name "$CONTAINER" "${OPTS[@]}" pi "$@"
      ;;
  esac
else
  # Non-interactive (piped, git hook, CI): one-shot container, no TTY
  docker compose run --rm -T "${OPTS[@]}" pi "$@"
fi
