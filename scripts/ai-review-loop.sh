#!/bin/bash
set -euo pipefail

# Load state from implement step (safe grep-based parsing — never source untrusted env files)
if [[ -f /tmp/ai-pr-state.env ]]; then
  _get() { grep "^$1=" /tmp/ai-pr-state.env | cut -d= -f2- | tr -d "'" | head -1; }
  PR_NUMBER=$(_get PR_NUMBER)
  BRANCH=$(_get BRANCH)
  ISSUE_NUMBER=$(_get ISSUE_NUMBER)
  LEARNINGS_GIST_ID=$(_get LEARNINGS_GIST_ID)
  BUILD_FAILED=$(_get BUILD_FAILED)
  START_TIME=$(_get START_TIME)
  TODAY=$(_get TODAY)
  unset -f _get
fi

: "${PR_NUMBER:?PR_NUMBER not set — implement step must run first}"
: "${BRANCH:?BRANCH not set}"
: "${ISSUE_NUMBER:?ISSUE_NUMBER not set}"

START_TIME=${START_TIME:-$SECONDS}
TODAY=${TODAY:-$(date -u +%Y-%m-%d)}
MAX_ITERATIONS=4
FINAL_CRITICAL_COUNT=0
FINAL_HIGH_COUNT=0
FINAL_VERDICT="UNKNOWN"
REVIEW_SUMMARY=""
UNRESOLVED_CRITICAL=""

PI="pi --agent-team-subagent-skills disabled --no-session"
export PI_SKIP_VERSION_CHECK=1

strip_ansi() {
  sed 's/\x1B\[[0-9;?]*[a-zA-Z]//g; s/\x1B\[[<>][0-9;]*[a-zA-Z]//g; s/\x1B[()][0-9A-Za-z]//g'
}

pi_run() {
  local model="$1"
  local prompt="$2"
  local outfile="$3"
  local cache_env=""
  if [[ "$model" == *"deepseek"* ]]; then
    cache_env="PI_CACHE_RETENTION=long"
  fi
  printf '%s' "$prompt" | env $cache_env timeout 45m $PI --model "$model" 2>&1 | strip_ansi | tee "$outfile"
}

pi_run_with_fallback() {
  local primary_model="$1"
  local prompt="$2"
  local outfile="$3"
  local fallback_model="opencode-go/deepseek-v4-pro"

  if pi_run "$primary_model" "$prompt" "$outfile"; then
    return 0
  fi

  echo "⚠️ [pi_run_with_fallback] $primary_model failed, retrying once..." >&2
  sleep 5
  if pi_run "$primary_model" "$prompt" "$outfile"; then
    return 0
  fi

  echo "⚠️ [pi_run_with_fallback] $primary_model failed again, falling back to $fallback_model..." >&2
  if pi_run "$fallback_model" "$prompt" "$outfile"; then
    return 0
  fi

  echo "ERROR: All model attempts failed (primary: $primary_model, fallback: $fallback_model). Treating as PUSH WITH CAUTION." | tee "$outfile"
  return 0
}

pr_comment() {
  gh pr comment "$PR_NUMBER" --body "$1" || true
}

# --- Review loop ---
echo "=== Pre-push review loop ===" >&2

pr_comment "## 🔍 Review Loop Started

Model: kimi-k2.6 (fallback: deepseek-v4-pro)  
Max iterations: ${MAX_ITERATIONS}  
ETA: ~5-15 minutes

[View Actions run](https://github.com/${GITHUB_REPOSITORY:-}/actions/runs/${GITHUB_RUN_ID:-})"
FINAL_VERDICT="UNKNOWN"
ITER=0
REVIEW_SUMMARY=""

for ITER in $(seq 1 $MAX_ITERATIONS); do
  echo "=== Review iteration ${ITER}/${MAX_ITERATIONS} ===" >&2

  REVIEW_PROMPT="$(cat .pi/prompts/pre-push-review.md)

---

## CI Parsing Requirements

This review runs in an automated CI pipeline. Two strict requirements:

1. Do NOT write .review-stamp — the pipeline script handles that.
2. Your response MUST end with a JSON block in this exact format — nothing after it:
\`\`\`json
{
  \"verdict\": \"SAFE_TO_PUSH\",
  \"critical_count\": 0,
  \"high_count\": 0,
  \"summary\": \"one sentence verdict\"
}
\`\`\`
Valid verdict values: \"SAFE_TO_PUSH\", \"PUSH_WITH_CAUTION\", \"DO_NOT_PUSH\""

  pi_run_with_fallback "opencode-go/kimi-k2.6" "$REVIEW_PROMPT" "/tmp/review-${ITER}.txt"

  # Parse structured JSON verdict; fall back to plain-text grep if model skips the JSON block
  VERDICT_JSON=$(awk '/```json/{p=1;next} p && /```/{p=0} p' "/tmp/review-${ITER}.txt" | tail -20)
  VERDICT=$(echo "$VERDICT_JSON" | jq -r '.verdict // empty' 2>/dev/null || true)
  ITER_CRITICAL=$(echo "$VERDICT_JSON" | jq -r '.critical_count // 0' 2>/dev/null || echo "0")
  ITER_HIGH=$(echo "$VERDICT_JSON" | jq -r '.high_count // 0' 2>/dev/null || echo "0")
  if [[ -z "$VERDICT" ]]; then
    VERDICT=$(grep -ioE 'DO NOT PUSH|PUSH WITH CAUTION|SAFE TO PUSH' "/tmp/review-${ITER}.txt" | tail -1 |
      sed 's/DO NOT PUSH/DO_NOT_PUSH/; s/PUSH WITH CAUTION/PUSH_WITH_CAUTION/; s/SAFE TO PUSH/SAFE_TO_PUSH/' |
      tr '[:lower:]' '[:upper:]' || true)
    ITER_CRITICAL=0
    ITER_HIGH=0
  fi
  [[ -z "$VERDICT" ]] && VERDICT="UNKNOWN"
  FINAL_VERDICT="$VERDICT"
  FINAL_CRITICAL_COUNT="$ITER_CRITICAL"
  FINAL_HIGH_COUNT="$ITER_HIGH"

  pr_comment "## 🔍 Review — Iteration ${ITER}/${MAX_ITERATIONS}

$(cat "/tmp/review-${ITER}.txt")

---
**Verdict:** \`${VERDICT}\`"

  REVIEW_SUMMARY="${REVIEW_SUMMARY}
<details>
<summary>Iteration ${ITER} — ${VERDICT}</summary>

$(cat "/tmp/review-${ITER}.txt")

</details>"

  if [[ "$VERDICT" == "SAFE_TO_PUSH" ]]; then
    echo "Review passed on iteration ${ITER}" >&2
    break
  fi

  if [[ "$VERDICT" == "PUSH_WITH_CAUTION" && $ITER -ge $((MAX_ITERATIONS - 1)) ]]; then
    pr_comment "## ⚠️ Caution Required Before Merging

The review reached **PUSH WITH CAUTION** after ${ITER} iteration(s). The following issues must be reviewed before this PR is merged:

$(cat "/tmp/review-${ITER}.txt")"
    echo "Accepting PUSH WITH CAUTION at late iteration ${ITER}" >&2
    break
  fi

  if [[ $ITER -eq $MAX_ITERATIONS ]]; then
    pr_comment "⚠️ **Max review iterations (${MAX_ITERATIONS}) reached.** Proceeding with current state. Manual review required."
    break
  fi

  # Detect spinning: if >70% of findings overlap with previous iteration, break early
  if [[ $ITER -ge 3 ]]; then
    PREV_FINDINGS=$(grep -hE '\[CRITICAL\]|\[HIGH\]' "/tmp/review-$((ITER - 1)).txt" 2>/dev/null |
      sed 's/.*— //' | sort -u || true)
    CURR_FINDINGS=$(grep -hE '\[CRITICAL\]|\[HIGH\]' "/tmp/review-${ITER}.txt" 2>/dev/null |
      sed 's/.*— //' | sort -u || true)
    if [[ -n "$PREV_FINDINGS" && -n "$CURR_FINDINGS" ]]; then
      OVERLAP=$(comm -12 <(echo "$PREV_FINDINGS") <(echo "$CURR_FINDINGS") | wc -l | tr -d ' ')
      TOTAL=$(echo "$CURR_FINDINGS" | wc -l | tr -d ' ')
      if [[ "$TOTAL" -gt 0 && "$OVERLAP" -ge "$TOTAL" ]]; then
        pr_comment "## 🔄 Review loop spinning — same findings as iteration $((ITER - 1))

All findings from this iteration also appeared in the previous review. Breaking the loop to avoid wasted iterations. Findings will be posted to the PR for manual resolution."
        FINAL_VERDICT="PUSH_WITH_CAUTION"
        break
      fi
    fi
  fi

  echo "=== Fixing review findings (iteration ${ITER}) ===" >&2

  pr_comment "## 🔧 Fixing Issues — Iteration ${ITER}/${MAX_ITERATIONS}

Applying fixes for findings from review iteration ${ITER}...

[View Actions run](https://github.com/${GITHUB_REPOSITORY:-}/actions/runs/${GITHUB_RUN_ID:-})"

  # Build history of prior fix attempts for context
  PRIOR_FIXES=""
  for prev in $(seq 1 $((ITER - 1))); do
    if [[ -f "/tmp/fix-${prev}.txt" ]]; then
      PRIOR_FIXES="${PRIOR_FIXES}
### Fix attempt ${prev} (already applied — do not repeat these):
$(head -50 "/tmp/fix-${prev}.txt")
---"
    fi
  done

  FIX_PROMPT="The review found CRITICAL or HIGH severity issues that must be fixed.

Fix all CRITICAL and HIGH severity issues from the review findings below. Ignore MEDIUM and LOW issues.

First, read the review diff files (if present) to understand the code context around the flagged issues:
\`\`\`
$(ls .claude/pre-push-review/*-diff.txt 2>/dev/null && echo '(diff files exist in the directory above — read them)' || echo '(no diff files available)')
\`\`\`

Then, check the current state of changed files:
\`\`\`
$(git diff --stat HEAD~1 2>/dev/null || echo 'No prior commits to diff')
\`\`\`

After fixing, commit with:
git add -A && git commit -m 'fix: address review findings (iteration ${ITER})'

Then push the fix:
git rev-parse HEAD >.review-stamp && git push origin ${BRANCH}

IMPORTANT: Do not re-introduce issues that were fixed in previous iterations (see prior fix history below).

## Review Findings (iteration ${ITER})

$(cat "/tmp/review-${ITER}.txt")
${PRIOR_FIXES:+
## Prior Fix History (already applied — avoid undoing these)
${PRIOR_FIXES}}"

  timeout 20m pi_run "opencode-go/deepseek-v4-pro" "$FIX_PROMPT" "/tmp/fix-${ITER}.txt" || {
    echo "⚠️ Fix agent timed out after 20 minutes — skipping this iteration" >&2
    continue
  }

  pr_comment "## 🔧 Fixes Applied — Iteration ${ITER}

<details>
<summary>Fix session log</summary>

\`\`\`
$(cat "/tmp/fix-${ITER}.txt")
\`\`\`

</details>"

done

# If CRITICAL findings remain after all iterations, downgrade verdict
if [[ "$FINAL_CRITICAL_COUNT" -gt 0 && "$FINAL_VERDICT" != "SAFE_TO_PUSH" ]]; then
  FINAL_VERDICT="PUSH_WITH_CAUTION"
  UNRESOLVED_CRITICAL=true
  pr_comment "## ⚠️ ${FINAL_CRITICAL_COUNT} CRITICAL finding(s) remain unresolved after ${ITER} iteration(s)

Reply with \`/ai fix <description>\` on this PR to address specific findings."
  REVIEW_SUMMARY="${REVIEW_SUMMARY}

### ⚠️ Unresolved CRITICAL Findings

$(cat "/tmp/review-${ITER}.txt")"
fi

# --- Mark PR ready or leave draft ---
if [[ "$FINAL_VERDICT" == "SAFE_TO_PUSH" ]]; then
  echo "=== Marking PR #${PR_NUMBER} as ready ===" >&2
  gh pr ready "$PR_NUMBER" 2>/dev/null || true
else
  echo "=== Leaving PR #${PR_NUMBER} as draft (verdict: ${FINAL_VERDICT}) ===" >&2
fi

# --- Label PR if unresolved critical findings ---
if [[ -n "${UNRESOLVED_CRITICAL:-}" ]]; then
  echo "=== Labeling PR #${PR_NUMBER} with ai-review-unresolved ===" >&2
  gh label create "ai-review-unresolved" \
    --color "b60205" \
    --description "AI implementation has unresolved review findings — manual review required" \
    2>/dev/null || true
  gh pr edit "$PR_NUMBER" --add-label "ai-review-unresolved" 2>/dev/null || true
fi

# --- Post final summary to PR ---
CI=true pnpm pr:generate 2>/dev/null || true

pr_comment "## ✅ Review Complete

**Final verdict:** \`${FINAL_VERDICT}\`
**Iterations:** ${ITER}/${MAX_ITERATIONS}
${UNRESOLVED_CRITICAL:+
**⚠️ Unresolved CRITICAL findings — manual review required before merge.**
}
${REVIEW_SUMMARY}

[View Actions run](https://github.com/${GITHUB_REPOSITORY:-}/actions/runs/${GITHUB_RUN_ID:-})"

# --- GitHub Actions Step Summary ---
if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  REVIEW_VER=$(grep -m1 'version:' .pi/prompts/pre-push-review.md | grep -oE '[0-9]+\.[0-9]+' || echo 'unknown')
  IMPL_VER=$(grep -m1 'version:' .pi/prompts/ai-issue-implement.md | grep -oE '[0-9]+\.[0-9]+' || echo 'unknown')
  DURATION=$((SECONDS - START_TIME))
  cat >>"$GITHUB_STEP_SUMMARY" <<EOF
## 🤖 AI Implementation — Issue #${ISSUE_NUMBER}

| Phase | Model |
|-------|-------|
| Implementation | deepseek-v4-pro |
| Review | kimi-k2.6 (fallback: deepseek-v4-pro) |

| Metric | Value |
|--------|-------|
| Review iterations | ${ITER}/${MAX_ITERATIONS} |
| Final verdict | \`${FINAL_VERDICT}\` |
| Total duration | $((DURATION / 60))m $((DURATION % 60))s |

Prompts: implement v${IMPL_VER} · review v${REVIEW_VER}
EOF
fi

# --- Capture security learnings in private Gist ---
if [[ -n "${GH_PR_CREATE_TOKEN:-}" && "$FINAL_VERDICT" != "UNKNOWN" ]]; then
  echo "=== Capturing security learnings ===" >&2

  LEARNINGS_GIST_ID="${LEARNINGS_GIST_ID:-}"
  if [[ -n "$LEARNINGS_GIST_ID" ]]; then
    GIST_PUBLIC=$(GH_TOKEN="$GH_PR_CREATE_TOKEN" gh api "/gists/${LEARNINGS_GIST_ID}" \
      --jq '.public' 2>/dev/null || echo "unknown")
    if [[ "$GIST_PUBLIC" == "true" ]]; then
      echo "SECURITY: Learnings Gist ${LEARNINGS_GIST_ID} is PUBLIC — refusing to write vulnerability data" >&2
      LEARNINGS_GIST_ID=""
    fi
  fi

  if [[ -z "$LEARNINGS_GIST_ID" ]]; then
    LEARNINGS_GIST_ID=$(GH_TOKEN="$GH_PR_CREATE_TOKEN" gh gist list --limit 100 2>/dev/null |
      grep 'AI Security Learnings' | awk '{print $1}' | head -1 || true)
  fi

  FINDINGS=$(grep -h -E '\[CRITICAL\]|\[HIGH\]' /tmp/review-*.txt 2>/dev/null |
    sed 's/.*— //' | sort -u || true)
  if [[ -n "$FINDINGS" ]]; then
    ENTRY="## ${TODAY} | PR #${PR_NUMBER} | ${FINAL_VERDICT}

${FINDINGS}

---"
    if [[ -z "$LEARNINGS_GIST_ID" ]]; then
      printf '# AI Security Learnings\n\n%s\n' "$ENTRY" >/tmp/learnings.md
      LEARNINGS_GIST_ID=$(jq -n \
        --arg content "$(cat /tmp/learnings.md)" \
        '{"description":"AI Security Learnings","public":false,"files":{"learnings.md":{"content":$content}}}' |
        GH_TOKEN="$GH_PR_CREATE_TOKEN" gh api /gists --method POST --input - \
          --jq '.id' 2>/dev/null || true)
      echo "Created learnings Gist ${LEARNINGS_GIST_ID}" >&2
    else
      CURRENT=$(GH_TOKEN="$GH_PR_CREATE_TOKEN" gh api "/gists/${LEARNINGS_GIST_ID}" \
        --jq '.files["learnings.md"].content' 2>/dev/null || echo '# AI Security Learnings')
      printf '%s\n\n%s\n' "$CURRENT" "$ENTRY" >/tmp/learnings.md
      jq -n \
        --arg content "$(cat /tmp/learnings.md)" \
        '{"files":{"learnings.md":{"content":$content}}}' |
        GH_TOKEN="$GH_PR_CREATE_TOKEN" gh api "/gists/${LEARNINGS_GIST_ID}" \
          --method PATCH --input - >/dev/null 2>&1
      echo "Updated learnings Gist ${LEARNINGS_GIST_ID}" >&2
    fi
  else
    echo "No CRITICAL/HIGH findings — nothing to capture" >&2
  fi
fi

# --- Append eval run data to private evals Gist ---
if [[ -n "${GH_PR_CREATE_TOKEN:-}" && "$FINAL_VERDICT" != "UNKNOWN" ]]; then
  echo "=== Appending eval run data ===" >&2
  EVALS_GIST_ID=$(GH_TOKEN="$GH_PR_CREATE_TOKEN" gh gist list --limit 100 2>/dev/null |
    grep 'AI Implementation Evals' | awk '{print $1}' | head -1 || true)

  if [[ -n "$EVALS_GIST_ID" ]]; then
    GIST_PUBLIC=$(GH_TOKEN="$GH_PR_CREATE_TOKEN" gh api "/gists/${EVALS_GIST_ID}" \
      --jq '.public' 2>/dev/null || echo "unknown")
    if [[ "$GIST_PUBLIC" == "true" ]]; then
      echo "SECURITY: Evals Gist ${EVALS_GIST_ID} is PUBLIC — refusing to write eval data" >&2
      EVALS_GIST_ID=""
    fi
  fi

  REVIEW_VER=$(grep -m1 'version:' .pi/prompts/pre-push-review.md | grep -oE '[0-9]+\.[0-9]+' || echo 'unknown')
  IMPL_VER=$(grep -m1 'version:' .pi/prompts/ai-issue-implement.md | grep -oE '[0-9]+\.[0-9]+' || echo 'unknown')
  DURATION=$((SECONDS - START_TIME))

  EVAL_LINE=$(jq -nc \
    --arg date "$TODAY" \
    --argjson issue "$ISSUE_NUMBER" \
    --arg prompt_ver "$IMPL_VER" \
    --arg review_ver "$REVIEW_VER" \
    --arg verdict "$FINAL_VERDICT" \
    --argjson iterations "$ITER" \
    --argjson critical "$FINAL_CRITICAL_COUNT" \
    --argjson high "$FINAL_HIGH_COUNT" \
    --argjson duration_s "$DURATION" \
    '{
      date: $date,
      issue: $issue,
      prompt_ver: $prompt_ver,
      review_ver: $review_ver,
      verdict: $verdict,
      iterations: $iterations,
      critical: $critical,
      high: $high,
      duration_s: $duration_s
    }')

  if [[ -z "$EVALS_GIST_ID" ]]; then
    printf '%s\n' "$EVAL_LINE" >/tmp/evals.jsonl
    EVALS_GIST_ID=$(jq -n \
      --arg content "$(cat /tmp/evals.jsonl)" \
      '{"description":"AI Implementation Evals","public":false,"files":{"runs.jsonl":{"content":$content}}}' |
      GH_TOKEN="$GH_PR_CREATE_TOKEN" gh api /gists --method POST --input - \
        --jq '.id' 2>/dev/null || true)
    echo "Created evals Gist ${EVALS_GIST_ID}" >&2
  else
    CURRENT=$(GH_TOKEN="$GH_PR_CREATE_TOKEN" gh api "/gists/${EVALS_GIST_ID}" \
      --jq '.files["runs.jsonl"].content' 2>/dev/null || echo '')
    printf '%s\n%s\n' "$CURRENT" "$EVAL_LINE" >/tmp/evals.jsonl
    jq -n \
      --arg content "$(cat /tmp/evals.jsonl)" \
      '{"files":{"runs.jsonl":{"content":$content}}}' |
      GH_TOKEN="$GH_PR_CREATE_TOKEN" gh api "/gists/${EVALS_GIST_ID}" \
        --method PATCH --input - >/dev/null 2>&1
    echo "Updated evals Gist ${EVALS_GIST_ID}" >&2
  fi
fi

# --- Output verdict for downstream steps ---
echo "review_verdict=${FINAL_VERDICT}" >>"$GITHUB_OUTPUT"
echo "review_iterations=${ITER}" >>"$GITHUB_OUTPUT"
