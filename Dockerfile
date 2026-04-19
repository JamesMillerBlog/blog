FROM node:22.13.0-slim

RUN apt-get update && apt-get install -y python3 git curl ca-certificates tzdata && rm -rf /var/lib/apt/lists/*

ENV TZ=Europe/London

RUN npm install -g @anthropic-ai/claude-code@2.1.114 pnpm@9.15.9

RUN useradd -m -s /bin/bash claude

RUN mkdir -p /home/claude/.claude && chown claude:claude /home/claude/.claude
COPY --chown=claude:claude docker/claude-settings.json /home/claude/.claude/settings.json

WORKDIR /workspace

USER claude

ENTRYPOINT ["claude", "--dangerously-skip-permissions"]
