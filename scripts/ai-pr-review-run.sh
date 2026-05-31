#!/bin/bash
set -euo pipefail

PR_NUMBER="${PR_NUMBER:?PR_NUMBER not set}"

PI="pi --agent-team-subagent-skills disabled --no-session"
export PI_SKIP_VERSION_CHECK=1

strip_ansi() {
  sed 's/\x1B\[[0-9;?]*[a-zA-Z]//g; s/\x1B\[[<>][0-9;]*[a-zA-Z]//g; s/\x1B[()][0-9A-Za-z]//g'
}

echo "=== Generating review manifest ===" >&2
bash scripts/pre-push-review-manifest.sh

REVIEW_PROMPT="$(cat .pi/prompts/pre-push-review.md)

---

## CI Parsing Requirements

This review runs in an automated CI pipeline. Do NOT write .review-stamp.
Your response MUST end with a JSON block in this exact format — nothing after it:
\`\`\`json
{
  \"verdict\": \"SAFE_TO_PUSH\",
  \"critical_count\": 0,
  \"high_count\": 0,
  \"summary\": \"one sentence verdict\",
  \"findings\": [
    {
      \"severity\": \"HIGH\",
      \"location\": \"path/file.tsx:42\",
      \"description\": \"concise description of the issue\",
      \"suggestion\": \"concise fix recommendation\"
    }
  ]
}
\`\`\`
Valid verdict values: \"SAFE_TO_PUSH\", \"PUSH_WITH_CAUTION\", \"DO_NOT_PUSH\"
Include ALL CRITICAL and HIGH findings in the findings array. MEDIUM/LOW may be omitted."

printf '%s' "$REVIEW_PROMPT" | \
  PI_CACHE_RETENTION=long timeout 45m $PI --model "opencode/claude-sonnet-4-6" 2>&1 | \
  strip_ansi | tee /tmp/pr-review-output.txt

VERDICT_JSON=$(awk '/```json/{p=1;next} p && /```/{p=0} p' /tmp/pr-review-output.txt | tail -100)
VERDICT=$(echo "$VERDICT_JSON" | jq -r '.verdict // empty' 2>/dev/null || true)
CRITICAL_COUNT=$(echo "$VERDICT_JSON" | jq -r '.critical_count // 0' 2>/dev/null || echo "0")
HIGH_COUNT=$(echo "$VERDICT_JSON" | jq -r '.high_count // 0' 2>/dev/null || echo "0")

if [[ -z "$VERDICT" ]]; then
  VERDICT=$(grep -ioE 'DO NOT PUSH|PUSH WITH CAUTION|SAFE TO PUSH' /tmp/pr-review-output.txt | tail -1 |
    sed 's/DO NOT PUSH/DO_NOT_PUSH/; s/PUSH WITH CAUTION/PUSH_WITH_CAUTION/; s/SAFE TO PUSH/SAFE_TO_PUSH/' |
    tr '[:lower:]' '[:upper:]' || true)
  CRITICAL_COUNT=0
  HIGH_COUNT=0
fi
[[ -z "$VERDICT" ]] && VERDICT="UNKNOWN"

cp /tmp/pr-review-output.txt /tmp/latest-review.txt

EMOJI="✅"
[[ "$VERDICT" == "PUSH_WITH_CAUTION" ]] && EMOJI="⚠️"
[[ "$VERDICT" == "DO_NOT_PUSH" ]] && EMOJI="❌"

VERDICT_LINE="${EMOJI} **AI Code Review** — \`${VERDICT}\` · Critical: ${CRITICAL_COUNT} · High: ${HIGH_COUNT}"

# Post each HIGH/CRITICAL finding as a separate comment for independent resolution
FINDINGS_JSON=$(echo "$VERDICT_JSON" | jq -c '.findings // [] | map(select(.severity == "CRITICAL" or .severity == "HIGH"))' 2>/dev/null || echo '[]')
FINDING_COUNT=$(echo "$FINDINGS_JSON" | jq 'length' 2>/dev/null || echo '0')

if [[ "$FINDING_COUNT" -gt 0 ]]; then
  HEAD_SHA=$(gh pr view "$PR_NUMBER" --json headRefOid --jq '.headRefOid' 2>/dev/null || true)
  REPO="${GITHUB_REPOSITORY:-}"
  if [[ -z "$REPO" ]]; then
    REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>/dev/null || true)
  fi

  for i in $(seq 0 $(( FINDING_COUNT - 1 ))); do
    SEVERITY=$(echo "$FINDINGS_JSON" | jq -r ".[$i].severity" 2>/dev/null || true)
    LOCATION=$(echo "$FINDINGS_JSON" | jq -r ".[$i].location" 2>/dev/null || true)
    DESCRIPTION=$(echo "$FINDINGS_JSON" | jq -r ".[$i].description" 2>/dev/null || true)
    SUGGESTION=$(echo "$FINDINGS_JSON" | jq -r ".[$i].suggestion" 2>/dev/null || true)

    FINDING_EMOJI="🔴"
    [[ "$SEVERITY" == "HIGH" ]] && FINDING_EMOJI="🟠"

    FINDING_NUM=$(( i + 1 ))
    COMMENT_BODY=$(printf '%s **%s finding %d/%d** — `%s`\n\n**Issue:** %s\n\n**Fix:** %s\n\n---\n\n`/ai Fix the %s severity finding at %s: %s`' \
      "$FINDING_EMOJI" "$SEVERITY" "$FINDING_NUM" "$FINDING_COUNT" \
      "$LOCATION" "$DESCRIPTION" "$SUGGESTION" \
      "$SEVERITY" "$LOCATION" "$SUGGESTION")

    FILE_PATH=$(printf '%s' "$LOCATION" | cut -d: -f1)
    LINE_NUM=$(printf '%s' "$LOCATION" | cut -d: -f2)
    COMMENT_ID=""
    COMMENT_TYPE=""

    # 1. Try line-specific inline diff comment
    if [[ -n "$HEAD_SHA" && -n "$REPO" && "$LINE_NUM" =~ ^[0-9]+$ && -n "$FILE_PATH" ]]; then
      RESP=$(gh api "repos/${REPO}/pulls/${PR_NUMBER}/comments" \
        --method POST \
        --field body="$COMMENT_BODY" \
        --field commit_id="$HEAD_SHA" \
        --field path="$FILE_PATH" \
        --field line="$LINE_NUM" \
        --field side='RIGHT' \
        2>/dev/null || true)
      COMMENT_ID=$(printf '%s' "$RESP" | jq -r '.id // empty' 2>/dev/null || true)
      [[ -n "$COMMENT_ID" ]] && COMMENT_TYPE='inline'
    fi

    # 2. Fall back to file-level inline comment (no line required)
    if [[ -z "$COMMENT_ID" && -n "$HEAD_SHA" && -n "$REPO" && -n "$FILE_PATH" ]]; then
      RESP=$(gh api "repos/${REPO}/pulls/${PR_NUMBER}/comments" \
        --method POST \
        --field body="$COMMENT_BODY" \
        --field commit_id="$HEAD_SHA" \
        --field path="$FILE_PATH" \
        --field subject_type='file' \
        2>/dev/null || true)
      COMMENT_ID=$(printf '%s' "$RESP" | jq -r '.id // empty' 2>/dev/null || true)
      [[ -n "$COMMENT_ID" ]] && COMMENT_TYPE='inline'
    fi

    # 3. Fall back to PR timeline comment
    if [[ -z "$COMMENT_ID" && -n "$REPO" ]]; then
      RESP=$(gh api "repos/${REPO}/issues/${PR_NUMBER}/comments" \
        --method POST \
        --field body="$COMMENT_BODY" \
        2>/dev/null || true)
      COMMENT_ID=$(printf '%s' "$RESP" | jq -r '.id // empty' 2>/dev/null || true)
      [[ -n "$COMMENT_ID" ]] && COMMENT_TYPE='timeline'
    fi

    # Add 👀 reaction — signals the finding has been seen and queued
    if [[ -n "$COMMENT_ID" && "$COMMENT_ID" =~ ^[0-9]+$ ]]; then
      if [[ "$COMMENT_TYPE" == 'inline' ]]; then
        gh api "repos/${REPO}/pulls/comments/${COMMENT_ID}/reactions" \
          --method POST --field content='eyes' 2>/dev/null || true
      else
        gh api "repos/${REPO}/issues/comments/${COMMENT_ID}/reactions" \
          --method POST --field content='eyes' 2>/dev/null || true
      fi
    fi
  done
fi

[[ "$FINDING_COUNT" -gt 0 ]] && VERDICT_LINE="${VERDICT_LINE} — findings posted as inline comments"
gh pr comment "$PR_NUMBER" --body "${VERDICT_LINE}" || true

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  echo "verdict=${VERDICT}" >> "$GITHUB_OUTPUT"
  echo "critical_count=${CRITICAL_COUNT}" >> "$GITHUB_OUTPUT"
  echo "high_count=${HIGH_COUNT}" >> "$GITHUB_OUTPUT"
fi

echo "Review complete: ${VERDICT} (critical=${CRITICAL_COUNT}, high=${HIGH_COUNT})" >&2
