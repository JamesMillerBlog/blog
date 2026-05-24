#!/usr/bin/env bash
set -euo pipefail

# Required env vars: ISSUE_NUMBER, ISSUE_TITLE, ISSUE_BODY, OPENCODE_API_KEY, GH_TOKEN

: "${ISSUE_NUMBER:?ISSUE_NUMBER is required}"
: "${ISSUE_TITLE:?ISSUE_TITLE is required}"
: "${ISSUE_BODY:?ISSUE_BODY is required}"
: "${OPENCODE_API_KEY:?OPENCODE_API_KEY is required}"
: "${GH_TOKEN:?GH_TOKEN is required}"

PROMPT_FILE=$(mktemp)
trap 'rm -f "$PROMPT_FILE"' EXIT

cat > "$PROMPT_FILE" <<EOF
You are implementing a GitHub issue for a blog project. Work autonomously and post progress comments as you go.

Issue #${ISSUE_NUMBER}: ${ISSUE_TITLE}

${ISSUE_BODY}

Read AGENTS.md for project context, conventions, and design system.

Post progress updates to the GitHub issue using:
  gh issue comment ${ISSUE_NUMBER} --body "YOUR MESSAGE"

Work through these steps in order. Do not stop until all pass.

1. Post comment: "Starting implementation of #${ISSUE_NUMBER}"
2. Read AGENTS.md, then implement all code changes needed
3. Post a comment summarising what you changed and why
4. Run: cd web && pnpm typecheck — fix any errors and re-run until clean
5. Run: cd web && pnpm test — fix any failures and re-run until clean
6. Post comment: "Quality checks passing — running pre-push review"
7. Run: git add -A
8. Read .pi/prompts/pre-push-review.md and follow its instructions exactly
9. Fix any CRITICAL or HIGH findings from the review, then re-run typecheck and tests
10. Post comment: "Review passed — committing"
11. Run: git add -A && git commit -m "feat: #${ISSUE_NUMBER} ${ISSUE_TITLE}"
12. Post comment: "Done — CI will open the PR shortly"

Do not push or create a PR. CI handles that after you finish.
EOF

pi --print \
  --provider opencode-go \
  --api-key "$OPENCODE_API_KEY" \
  --agent-team-subagent-skills disabled \
  "$(cat "$PROMPT_FILE")"
