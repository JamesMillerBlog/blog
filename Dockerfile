FROM node:22-slim

RUN apt-get update && apt-get install -y python3 git curl ca-certificates && rm -rf /var/lib/apt/lists/*

RUN npm install -g @anthropic-ai/claude-code pnpm

RUN useradd -m -s /bin/bash claude

WORKDIR /workspace

USER claude

ENTRYPOINT ["claude"]
