#!/bin/bash
# Langfuse observability helpers. Source this file: . scripts/langfuse.sh
# Requires env vars: LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_BASE_URL
# For trace index (rating): GH_PR_CREATE_TOKEN must also be set

_lf_enabled() {
  [[ -n "${LANGFUSE_PUBLIC_KEY:-}" ]] && \
  [[ -n "${LANGFUSE_SECRET_KEY:-}" ]] && \
  [[ -n "${LANGFUSE_BASE_URL:-}" ]]
}

_lf_auth() {
  printf '%s' "${LANGFUSE_PUBLIC_KEY}:${LANGFUSE_SECRET_KEY}" | base64 -w0
}

_lf_now() {
  date -u +%Y-%m-%dT%H:%M:%S.000Z
}

_lf_uuid() {
  python3 -c 'import uuid; print(uuid.uuid4())'
}

_lf_post() {
  local path="$1" payload="$2"
  _lf_enabled || return 0
  curl -sf \
    -H "Authorization: Basic $(_lf_auth)" \
    -H 'Content-Type: application/json' \
    -d "$payload" \
    "${LANGFUSE_BASE_URL}${path}" >/dev/null 2>&1 || true
}

# Create a trace. Prints the trace ID to stdout.
lf_trace_create() {
  local name="$1" session_id="${2:-}" tags_json="${3:-[]}" metadata_json="${4:-{}}"
  _lf_enabled || { printf ''; return 0; }
  local trace_id
  trace_id=$(_lf_uuid)
  local payload
  payload=$(jq -n \
    --arg id "$trace_id" \
    --arg name "$name" \
    --arg session "$session_id" \
    --argjson tags "$tags_json" \
    --argjson meta "$metadata_json" \
    --arg ts "$(_lf_now)" \
    '{id: $id, name: $name, sessionId: $session, tags: $tags, metadata: $meta, timestamp: $ts, userId: "pi[bot]"}')
  _lf_post "/api/public/traces" "$payload"
  printf '%s' "$trace_id"
}

# Log an AI generation (model call) on an existing trace.
# Timestamps should be ISO8601 strings from _lf_now calls before/after the call.
# input_chars / output_chars are character counts used to estimate token usage.
lf_generation_log() {
  local trace_id="$1" name="$2" model="$3"
  local start_ts="$4" end_ts="$5"
  local input_chars="${6:-0}" output_chars="${7:-0}"
  local metadata_json="${8:-{}}"
  _lf_enabled || return 0
  [[ -z "$trace_id" ]] && return 0
  local gen_id input_tokens output_tokens payload
  gen_id=$(_lf_uuid)
  input_tokens=$(( input_chars / 4 + 1 ))
  output_tokens=$(( output_chars / 4 + 1 ))
  payload=$(jq -n \
    --arg id "$gen_id" \
    --arg trace "$trace_id" \
    --arg name "$name" \
    --arg model "$model" \
    --arg start "$start_ts" \
    --arg end "$end_ts" \
    --argjson usage "{\"input\": $input_tokens, \"output\": $output_tokens, \"unit\": \"TOKENS\"}" \
    --argjson meta "$metadata_json" \
    '{id: $id, traceId: $trace, name: $name, model: $model, startTime: $start, endTime: $end, usage: $usage, metadata: $meta}')
  _lf_post "/api/public/generations" "$payload"
}

# Log a non-AI event on a trace (e.g. "pr-created", "verdict").
lf_event_log() {
  local trace_id="$1" name="$2" metadata_json="${3:-{}}"
  _lf_enabled || return 0
  [[ -z "$trace_id" ]] && return 0
  local payload
  payload=$(jq -n \
    --arg id "$(_lf_uuid)" \
    --arg trace "$trace_id" \
    --arg name "$name" \
    --arg ts "$(_lf_now)" \
    --argjson meta "$metadata_json" \
    '{id: $id, traceId: $trace, name: $name, timestamp: $ts, metadata: $meta}')
  _lf_post "/api/public/events" "$payload"
}

# Post a human feedback score to a trace.
# value: 1 = good, 0 = bad (NUMERIC dataType)
lf_score_post() {
  local trace_id="$1" name="$2" value="$3" comment="${4:-}"
  _lf_enabled || return 0
  [[ -z "$trace_id" ]] && return 0
  local payload
  payload=$(jq -n \
    --arg trace "$trace_id" \
    --arg name "$name" \
    --argjson value "$value" \
    --arg comment "$comment" \
    '{traceId: $trace, name: $name, value: $value, comment: $comment, dataType: "NUMERIC"}')
  _lf_post "/api/public/scores" "$payload"
}

# Store a trace ID in a private "AI Trace Index" Gist, keyed by label.
# e.g. lf_trace_index_store "pr-123" "$TRACE_ID"
# Requires GH_PR_CREATE_TOKEN env var set to a token with gist scope.
lf_trace_index_store() {
  local key="$1" trace_id="$2"
  [[ -z "${GH_PR_CREATE_TOKEN:-}" ]] && return 0
  local gist_id
  gist_id=$(GH_TOKEN="$GH_PR_CREATE_TOKEN" gh gist list --limit 100 2>/dev/null |
    grep 'AI Trace Index' | awk '{print $1}' | head -1 || true)

  if [[ -z "$gist_id" ]]; then
    GH_TOKEN="$GH_PR_CREATE_TOKEN" gh gist create \
      --private \
      --desc 'AI Trace Index' \
      --filename 'index.json' \
      <(printf '{}') >/dev/null 2>&1 || true
    gist_id=$(GH_TOKEN="$GH_PR_CREATE_TOKEN" gh gist list --limit 100 2>/dev/null |
      grep 'AI Trace Index' | awk '{print $1}' | head -1 || true)
  fi

  [[ -z "$gist_id" ]] && return 0

  local current updated
  current=$(GH_TOKEN="$GH_PR_CREATE_TOKEN" gh api "/gists/${gist_id}" \
    --jq '.files["index.json"].content' 2>/dev/null || printf '{}')
  updated=$(printf '%s' "$current" | \
    jq -c --arg k "$key" --arg v "$trace_id" '.[$k] = $v' 2>/dev/null || printf '{}')
  GH_TOKEN="$GH_PR_CREATE_TOKEN" gh api "/gists/${gist_id}" \
    --method PATCH \
    --field "files[index.json][content]=$updated" >/dev/null 2>&1 || true
}

# Fetch a prompt from Langfuse by name (label: production).
# Falls back to local file path if Langfuse is unavailable or disabled.
# Usage: lf_prompt_get "prompt-name" ".pi/prompts/fallback.md"
lf_prompt_get() {
  local name="$1" fallback="${2:-}"
  if _lf_enabled; then
    local content
    content=$(curl -sf \
      -H "Authorization: Basic $(_lf_auth)" \
      "${LANGFUSE_BASE_URL}/api/public/prompts/$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$name")?label=production" \
      2>/dev/null | jq -r '.prompt // empty' 2>/dev/null || true)
    if [[ -n "$content" ]]; then
      printf '%s' "$content"
      return 0
    fi
  fi
  [[ -n "$fallback" ]] && cat "$fallback" || true
}

# Retrieve a trace ID from the "AI Trace Index" Gist by key.
# Prints the trace ID to stdout, or empty string if not found.
lf_trace_index_get() {
  local key="$1"
  [[ -z "${GH_PR_CREATE_TOKEN:-}" ]] && { printf ''; return 0; }
  local gist_id
  gist_id=$(GH_TOKEN="$GH_PR_CREATE_TOKEN" gh gist list --limit 100 2>/dev/null |
    grep 'AI Trace Index' | awk '{print $1}' | head -1 || true)
  [[ -z "$gist_id" ]] && { printf ''; return 0; }
  GH_TOKEN="$GH_PR_CREATE_TOKEN" gh api "/gists/${gist_id}" \
    --jq '.files["index.json"].content' 2>/dev/null |
    jq -r --arg k "$key" '.[$k] // empty' 2>/dev/null || printf ''
}
