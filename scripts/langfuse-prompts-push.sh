#!/bin/bash
# Push all .pi/prompts/*.md files to Langfuse as versioned prompts.
# Run manually after editing a prompt locally, or to seed initial prompts.
# Requires: LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_BASE_URL in env.
set -euo pipefail

. scripts/langfuse.sh

if ! _lf_enabled; then
  echo 'Error: LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, and LANGFUSE_BASE_URL must be set.' >&2
  exit 1
fi

_lf_auth_header() {
  printf 'Basic %s' "$(_lf_auth)"
}

push_prompt() {
  local name="$1" file="$2"
  if [[ ! -f "$file" ]]; then
    echo "  skip: $file not found" >&2
    return 0
  fi
  local content
  content=$(cat "$file")
  local payload
  payload=$(jq -n \
    --arg name "$name" \
    --arg prompt "$content" \
    '{name: $name, prompt: $prompt, labels: ["production"], type: "text", config: {}}')
  local http_code
  http_code=$(curl -sf -o /dev/null -w '%{http_code}' \
    -H "Authorization: $(_lf_auth_header)" \
    -H 'Content-Type: application/json' \
    -d "$payload" \
    "${LANGFUSE_BASE_URL}/api/public/prompts" 2>/dev/null || echo '000')
  if [[ "$http_code" =~ ^2 ]]; then
    echo "  pushed: $name (${file})" >&2
  else
    echo "  error: $name — HTTP $http_code" >&2
  fi
}

echo '=== Pushing prompts to Langfuse ===' >&2

push_prompt 'ai-issue-implement'          '.pi/prompts/ai-issue-implement.md'
push_prompt 'ai-pr-respond'               '.pi/prompts/ai-pr-respond.md'
push_prompt 'ai-pr-review'               '.pi/prompts/ai-pr-review.md'
push_prompt 'blog-improvement-radar'      '.pi/prompts/blog-improvement-radar.md'
push_prompt 'ai-pr-review-comment-assess' '.pi/prompts/ai-pr-review-comment-assess.md'
push_prompt 'council'                     '.pi/prompts/council.md'

echo '=== Done ===' >&2
