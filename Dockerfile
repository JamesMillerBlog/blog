FROM node:22.13.0-slim

RUN apt-get update && apt-get install -y python3 git curl ca-certificates tzdata && rm -rf /var/lib/apt/lists/*

ENV TZ=Europe/London

RUN npm install -g @anthropic-ai/claude-code pnpm

RUN useradd -m -s /bin/bash claude

WORKDIR /workspace

USER claude

ENTRYPOINT ["claude", "--dangerously-skip-permissions"]
