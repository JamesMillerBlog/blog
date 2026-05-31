#!/bin/bash
set -euo pipefail

PR_NUMBER="${PR_NUMBER:?PR_NUMBER not set}"
BRANCH="${BRANCH:?BRANCH not set}"
FIX_ITER="${FIX_ITER:-1}"
PRIOR_CONTEXT="${PRIOR_CONTEXT:-[]}"
REPO="${GITHUB_REPOSITORY:-}"

PI="pi --agent-team-subagent-skills disabled --no-session"
export PI_SKIP_VERSION_CHECK=1

strip_ansi() {
  sed 's/\x1B\[[0-9;?]*[a-zA-Z]//g; s/\x1B\[[<>][0-9;]*[a-zA-Z]//g; s/\x1B[()][0-9A-Za-z]//g'
}

if [[ -z "$REPO" ]]; then
  REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>/dev/null || true)
fi
OWNER="${REPO%%/*}"
REPO_NAME="${REPO##*/}"

echo "=== Fetching review findings for delta review ===" >&2
REVIEW_BODY=$(gh pr view "$PR_NUMBER" --json comments \
  --jq '[.comments[] | select(.author.login == "github-actions") | select(.body | test("^[✅⚠️❌] \\*\\*AI Code Review"))] | last | .body' \
  2>/dev/null || true)

if [[ -z "$REVIEW_BODY" ]] && [[ -f /tmp/latest-review.txt ]]; then
  REVIEW_BODY=$(cat /tmp/latest-review.txt)
fi

if [[ -z "$REVIEW_BODY" ]]; then
  echo "No review found — skipping delta review" >&2
  exit 0
fi

REVIEW_JSON=$(printf '%s' "$REVIEW_BODY" | awk '/```json/{p=1;next} p && /```/{p=0} p' | head -200)
FINDINGS=$(printf '%s' "$REVIEW_JSON" | \
  jq -c '[.findings[]? | select(.severity == "CRITICAL" or .severity == "HIGH")]' \
  2>/dev/null || echo '[]')
FINDING_COUNT=$(printf '%s' "$FINDINGS" | jq 'length' 2>/dev/null || echo '0')

if [[ "$FINDING_COUNT" -eq 0 ]]; then
  echo "No HIGH/CRITICAL findings — skipping delta review" >&2
  exit 0
fi

echo "=== Getting fix commit diff ===" >&2
FIX_DIFF=$(git diff HEAD~1 HEAD 2>/dev/null | head -400 || echo "(diff unavailable)")

FINDINGS_TEXT=$(printf '%s' "$FINDINGS" | jq -r \
  'to_entries[] | "### Finding \(.key + 1)\nSeverity: \(.value.severity)\nLocation: \(.value.location)\nIssue: \(.value.description)\nExpected fix: \(.value.suggestion)"')

echo "=== Running targeted delta review ===" >&2
DELTA_PROMPT="You are verifying whether a code fix correctly addresses specific findings from a prior code review. Be concise and precise.

## Findings To Verify

${FINDINGS_TEXT}

## Fix Diff

\`\`\`diff
${FIX_DIFF}
\`\`\`

For each finding (0-indexed), assess whether the diff correctly and completely addresses it.
Reply ONLY with this JSON block — nothing before or after:
\`\`\`json
{\"results\": [{\"index\": 0, \"status\": \"RESOLVED\", \"reason\": \"one sentence explanation\"}]}
\`\`\`
status must be exactly RESOLVED or UNRESOLVED."

printf '%s' "$DELTA_PROMPT" | \
  PI_CACHE_RETENTION=short timeout 10m $PI --model "opencode-go/deepseek-v4-pro" 2>&1 | \
  strip_ansi | tee /tmp/delta-review-output.txt || true

DELTA_JSON=$(awk '/```json/{p=1;next} p && /```/{p=0} p' /tmp/delta-review-output.txt | head -100)

if [[ -z "$DELTA_JSON" ]]; then
  echo "Delta review produced no parseable JSON — skipping result posting" >&2
  exit 0
fi

echo "=== Loading review threads for resolution ===" >&2
REVIEW_THREADS=$(gh api graphql \
  -f query='query($owner:String!,$repo:String!,$pr:Int!){repository(owner:$owner,name:$repo){pullRequest(number:$pr){reviewThreads(first:100){nodes{id isResolved comments(first:10){nodes{databaseId}}}}}}}' \
  -f owner="$OWNER" -f repo="$REPO_NAME" -F pr="$PR_NUMBER" \
  --jq '.data.repository.pullRequest.reviewThreads.nodes' \
  2>/dev/null || echo '[]')

resolve_review_thread() {
  local comment_id="$1"
  local thread_id
  thread_id=$(printf '%s' "$REVIEW_THREADS" | \
    jq -r --argjson cid "$comment_id" \
      '[.[] | select(.isResolved == false) | select(.comments.nodes[].databaseId == $cid)] | first | .id // empty' \
    2>/dev/null || true)
  if [[ -n "$thread_id" ]]; then
    gh api graphql \
      -f query='mutation($id:ID!){resolveReviewThread(input:{threadId:$id}){thread{isResolved}}}' \
      -f id="$thread_id" 2>/dev/null || true
    echo "Resolved thread for comment ${comment_id}" >&2
  fi
}

echo "=== Posting delta review results to finding threads ===" >&2
FINDING_COMMENTS=$(gh api "repos/${REPO}/pulls/${PR_NUMBER}/comments" \
  --jq '[.[] | select(.user.login == "github-actions[bot]") | select(.body | test("\\*\\*(CRITICAL|HIGH) finding")) | {id: .id, body: .body}]' \
  2>/dev/null || echo '[]')

RESULT_COUNT=$(printf '%s' "$DELTA_JSON" | jq '.results | length' 2>/dev/null || echo '0')
UNRESOLVED_FINDINGS='[]'
UNRESOLVED_DELTA_RESULTS='[]'

for i in $(seq 0 $(( RESULT_COUNT - 1 ))); do
  RESULT=$(printf '%s' "$DELTA_JSON" | jq -c ".results[$i]" 2>/dev/null || continue)
  FINDING_IDX=$(printf '%s' "$RESULT" | jq -r '.index' 2>/dev/null || continue)
  STATUS=$(printf '%s' "$RESULT" | jq -r '.status' 2>/dev/null || continue)
  REASON=$(printf '%s' "$RESULT" | jq -r '.reason' 2>/dev/null || continue)

  LOCATION=$(printf '%s' "$FINDINGS" | jq -r ".[$FINDING_IDX].location" 2>/dev/null || true)

  COMMENT_ID=""
  if [[ -n "$LOCATION" ]]; then
    COMMENT_ID=$(printf '%s' "$FINDING_COMMENTS" | \
      jq -r --arg loc "$LOCATION" \
        '[.[] | select(.body | contains($loc))] | first | .id // empty' \
      2>/dev/null || true)
  fi

  if [[ "$STATUS" == 'RESOLVED' ]]; then
    MSG="✅ **Delta review (iter ${FIX_ITER}):** Fix confirmed — ${REASON}"
    # Resolve the GitHub thread so it collapses in the UI
    if [[ -n "$COMMENT_ID" && "$COMMENT_ID" =~ ^[0-9]+$ ]]; then
      resolve_review_thread "$COMMENT_ID"
    fi
  else
    MSG="⚠️ **Delta review (iter ${FIX_ITER}):** Fix incomplete — ${REASON}"
    FINDING=$(printf '%s' "$FINDINGS" | jq -c ".[$FINDING_IDX]" 2>/dev/null || true)
    if [[ -n "$FINDING" && "$FINDING" != 'null' ]]; then
      UNRESOLVED_FINDINGS=$(printf '%s' "$UNRESOLVED_FINDINGS" | \
        jq -c ". + [$FINDING]" 2>/dev/null || echo "$UNRESOLVED_FINDINGS")
    fi
    DELTA_RESULT=$(jq -n \
      --arg loc "${LOCATION:-unknown}" \
      --arg reason "$REASON" \
      '{"location": $loc, "reason": $reason}')
    UNRESOLVED_DELTA_RESULTS=$(printf '%s' "$UNRESOLVED_DELTA_RESULTS" | \
      jq -c ". + [$DELTA_RESULT]" 2>/dev/null || echo "$UNRESOLVED_DELTA_RESULTS")
  fi

  if [[ -n "$COMMENT_ID" && "$COMMENT_ID" =~ ^[0-9]+$ ]]; then
    gh api "repos/${REPO}/pulls/comments/${COMMENT_ID}/replies" \
      --method POST --field body="$MSG" 2>/dev/null || true
  else
    gh pr comment "$PR_NUMBER" --body "$MSG" 2>/dev/null || true
  fi
done

# Persist unresolved findings for same-runner consumers
UNRESOLVED_COUNT=$(printf '%s' "$UNRESOLVED_FINDINGS" | jq 'length' 2>/dev/null || echo '0')
if [[ "$UNRESOLVED_COUNT" -gt 0 ]]; then
  printf '%s' "$UNRESOLVED_FINDINGS" > /tmp/unresolved-findings.json
  echo "Saved ${UNRESOLVED_COUNT} unresolved finding(s) to /tmp/unresolved-findings.json" >&2
else
  rm -f /tmp/unresolved-findings.json
fi

# Handle re-dispatch or escalation based on unresolved count
if [[ "$UNRESOLVED_COUNT" -gt 0 ]]; then
  ITER_COUNT=$(gh pr view "${PR_NUMBER}" --json labels \
    --jq '[.labels[].name | select(startswith("ai-fix-iter-"))] | length' \
    2>/dev/null || echo '0')

  if [[ "${ITER_COUNT}" -ge 3 ]]; then
    echo "=== Max fix iterations (3) reached — escalating to human ===" >&2
    gh label create 'ai-review-needs-human' \
      --color 'b60205' \
      --description 'AI review findings could not be auto-fixed' \
      2>/dev/null || true
    gh pr edit "${PR_NUMBER}" --add-label 'ai-review-needs-human' 2>/dev/null || true
    gh pr comment "${PR_NUMBER}" \
      --body "🚨 **${UNRESOLVED_COUNT} finding(s) still unresolved after ${ITER_COUNT} fix iteration(s).** Manual intervention required." || true
  else
    NEXT_ITER=$(( FIX_ITER + 1 ))

    # Build context entry for this failed attempt so the next fixer knows what was tried
    FIX_DIFF_SUMMARY=$(printf '%s' "$FIX_DIFF" | head -50 | head -c 2000)
    CONTEXT_ENTRY=$(jq -n \
      --argjson iter "${FIX_ITER}" \
      --arg diff "$FIX_DIFF_SUMMARY" \
      --argjson delta "$UNRESOLVED_DELTA_RESULTS" \
      --argjson findings "$UNRESOLVED_FINDINGS" \
      '{"iter": $iter, "fix_diff": $diff, "failed_reasons": $delta, "findings": $findings}')

    # Validate existing PRIOR_CONTEXT is a JSON array; fall back to empty
    if ! printf '%s' "$PRIOR_CONTEXT" | jq -e '. | arrays' >/dev/null 2>&1; then
      PRIOR_CONTEXT='[]'
    fi
    NEW_PRIOR=$(printf '%s' "$PRIOR_CONTEXT" | \
      jq -c --argjson entry "$CONTEXT_ENTRY" '. + [$entry]' 2>/dev/null || \
      printf '[%s]' "$CONTEXT_ENTRY")

    echo "=== Re-dispatching fix iteration ${NEXT_ITER} with enriched context ===" >&2
    jq -n \
      --arg event_type 'pr-review-needs-fix' \
      --arg pr "${PR_NUMBER}" \
      --arg branch "${BRANCH}" \
      --arg iter "${NEXT_ITER}" \
      --arg context "${NEW_PRIOR}" \
      '{event_type: $event_type, client_payload: {pr_number: $pr, branch: $branch, fix_iter: $iter, prior_context: $context}}' | \
      gh api "repos/${REPO}/dispatches" --method POST --input - 2>/dev/null || true
  fi
elif [[ "$RESULT_COUNT" -gt 0 ]]; then
  gh pr comment "${PR_NUMBER}" \
    --body "🎉 **All findings resolved** (iteration ${FIX_ITER}) — delta review confirmed all CRITICAL/HIGH issues fixed." || true
fi

echo "Delta review complete" >&2
