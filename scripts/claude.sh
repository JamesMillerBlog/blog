#!/bin/bash
printf '\033[1;36m▶ Notifications: https://ntfy.sh/%s\033[0m\n' "$NTFY_TOPIC"
printf '\033[0;33m  Tip: use pnpm claude:fresh if Dockerfile or deps changed\033[0m\n'

if [ -n "$BLOG_GIT_DIR" ]; then
  BLOG_GIT_DIR=$(realpath "$BLOG_GIT_DIR") || { echo "Error: BLOG_GIT_DIR is not a valid path: $BLOG_GIT_DIR"; exit 1; }
  docker compose run --rm -v "$BLOG_GIT_DIR:$BLOG_GIT_DIR:ro" claude
else
  docker compose run --rm claude
fi
