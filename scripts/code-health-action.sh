#!/bin/bash
set -euo pipefail

# ─── Code Health Report Interpreter ──────────────────────────────────────────
# Parses the latest content of a weekly code-health issue and dispatches
# follow-up actions:
#   1. Opens a PR adding cspell false-positives to web/cspell.json
#   2. Opens a focused `ai-implement` issue for missing tests
#   3. Closes the report issue when both steps are done (or no-op'd)
#
# Idempotency: each completed step adds a label to the report issue.
# Re-running the script (via /resume-health or workflow_dispatch) skips
# steps already marked done.
#
# Env vars (required):
#   GH_TOKEN              token for read/comment/close on the report issue
#   GH_PR_CREATE_TOKEN    PAT used to push the spell PR and create the
#                         ai-implement issue (so downstream workflows fire)
#   ISSUE_NUMBER          report issue number
#   REPO                  owner/name
# ──────────────────────────────────────────────────────────────────────────────

: "${GH_TOKEN:?required}"
: "${GH_PR_CREATE_TOKEN:?required}"
: "${ISSUE_NUMBER:?required}"
: "${REPO:?required}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

SPELL_LABEL='health-spell-done'
TESTS_LABEL='health-tests-done'

log() { printf '▸ %s\n' "$*"; }

ensure_label() {
  local name="$1" color="$2" desc="$3"
  gh label create "$name" --color "$color" --description "$desc" --force >/dev/null 2>&1 || true
}

issue_has_label() {
  local name="$1"
  gh issue view "$ISSUE_NUMBER" --json labels --jq ".labels[].name" | grep -Fxq "$name"
}

add_label() {
  gh issue edit "$ISSUE_NUMBER" --add-label "$1" >/dev/null
}

# ─── 1. Pull issue content (body + all comments) ─────────────────────────────

log "Fetching issue #$ISSUE_NUMBER content"

gh issue view "$ISSUE_NUMBER" --json body,comments \
  --jq '.body + "\n" + (.comments | map(.body) | join("\n"))' \
  > "$WORK/content.txt"

# ─── 2. Parse spell-check warnings ───────────────────────────────────────────

log "Extracting cspell warnings"

# cspell output looks like:  path:line:col - Unknown word (Foo)
grep -oE 'Unknown word \([^)]+\)' "$WORK/content.txt" \
  | sed -E 's/Unknown word \(([^)]+)\)/\1/' \
  | sort -u > "$WORK/spell-words.txt" || true

SPELL_COUNT=$(wc -l < "$WORK/spell-words.txt" | tr -d ' ')
log "Found $SPELL_COUNT unique spell warning(s)"

# ─── 3. Parse test-gap file list ─────────────────────────────────────────────

log "Extracting test-gap files"

# Lines under "Files without tests:" look like:  src/foo.tsx (12 lines)
python3 - "$WORK/content.txt" > "$WORK/test-gaps.txt" <<'PY'
import re, sys
text = open(sys.argv[1]).read()
# Take the LAST occurrence of the test-gap block (most recent report)
blocks = re.findall(
    r'Files without tests:\s*\n((?:\s+src/.*\n)+)',
    text,
)
if not blocks:
    sys.exit(0)
last = blocks[-1]
SKIP_PREFIXES = ('src/__mocks__/', 'src/types/')
SKIP_NAMES = ('index.ts',)
for line in last.splitlines():
    m = re.match(r'\s*(src/\S+)\s+\((\d+)\s+lines\)', line)
    if not m:
        continue
    path, lines = m.group(1), int(m.group(2))
    if any(path.startswith(p) for p in SKIP_PREFIXES):
        continue
    if path.endswith(SKIP_NAMES) and lines < 50:
        continue
    if lines <= 15:
        continue
    print(f'{path}\t{lines}')
PY

TESTS_COUNT=$(wc -l < "$WORK/test-gaps.txt" | tr -d ' ')
log "Identified $TESTS_COUNT file(s) worth backfilling tests for"

# ─── 4. Ensure tracking labels exist ─────────────────────────────────────────

ensure_label "$SPELL_LABEL"  '0e8a16' 'Spell-check follow-up dispatched'
ensure_label "$TESTS_LABEL"  '0e8a16' 'Test-coverage follow-up dispatched'

# ─── 5. Spell-check fix PR ───────────────────────────────────────────────────

handle_spell() {
  if issue_has_label "$SPELL_LABEL"; then
    log "Spell step already done — skipping"
    return 0
  fi

  if [ "$SPELL_COUNT" -eq 0 ]; then
    log "No spell warnings to action — marking done"
    gh issue comment "$ISSUE_NUMBER" --body "**Spell check:** no warnings to dictionary."
    add_label "$SPELL_LABEL"
    return 0
  fi

  log "Building cspell dictionary update"

  python3 - "$WORK/spell-words.txt" web/cspell.json \
    "$WORK/cspell.new.json" "$WORK/added-words.txt" <<'PY'
import json, sys
words_file, target, out_cfg, out_added = sys.argv[1:5]
new = [w.strip() for w in open(words_file) if w.strip()]
cfg = json.load(open(target))
existing = {w.lower() for w in cfg.get('words', [])}
added = []
for w in new:
    if w.lower() not in existing:
        cfg.setdefault('words', []).append(w)
        existing.add(w.lower())
        added.append(w)
with open(out_cfg, 'w') as f:
    json.dump(cfg, f, indent=2)
    f.write('\n')
with open(out_added, 'w') as f:
    f.write('\n'.join(added))
PY

  ADDED_WORDS=$(cat "$WORK/added-words.txt")

  if [ -z "$ADDED_WORDS" ]; then
    log "All spell words already in dictionary — marking done"
    gh issue comment "$ISSUE_NUMBER" --body "**Spell check:** all flagged words already in \`web/cspell.json\`."
    add_label "$SPELL_LABEL"
    return 0
  fi

  local branch="ai/code-health-${ISSUE_NUMBER}-spell"

  # If a PR for this branch already exists from a previous partial run,
  # reuse it instead of failing.
  local existing_pr
  existing_pr=$(GH_TOKEN="$GH_PR_CREATE_TOKEN" gh pr list \
    --head "$branch" --state open --json url --jq '.[0].url' 2>/dev/null || true)
  if [ -n "$existing_pr" ]; then
    log "Reusing existing spell PR: $existing_pr"
    gh issue comment "$ISSUE_NUMBER" --body "**Spell check follow-up:** $existing_pr"
    add_label "$SPELL_LABEL"
    return 0
  fi

  mv "$WORK/cspell.new.json" web/cspell.json
  (cd web && pnpm exec prettier --write cspell.json) >/dev/null

  git config user.name 'pi[bot]'
  git config user.email 'pi[bot]@users.noreply.github.com'
  git checkout -B "$branch"
  git add web/cspell.json
  git commit -m "chore: add cspell false-positives flagged by weekly health report (#${ISSUE_NUMBER})"

  # Push and open PR using the PAT so downstream review workflows fire.
  git remote set-url origin "https://x-access-token:${GH_PR_CREATE_TOKEN}@github.com/${REPO}.git"
  git push -u --force-with-lease origin "$branch"

  local pr_body
  pr_body=$(printf '## Summary\n\nAdds %d cspell dictionary entries flagged by weekly code-health report #%s.\n\nAdded words:\n```\n%s\n```\n\n## Test plan\n- [ ] `cd web && pnpm exec cspell "src/**/*.{ts,tsx}"` is clean for these terms\n' \
    "$(echo "$ADDED_WORDS" | wc -l | tr -d ' ')" "$ISSUE_NUMBER" "$ADDED_WORDS")

  local pr_url
  pr_url=$(GH_TOKEN="$GH_PR_CREATE_TOKEN" gh pr create \
    --title "chore: dictionary updates from code-health #${ISSUE_NUMBER}" \
    --body "$pr_body" \
    --base main \
    --head "$branch")

  log "Opened spell PR: $pr_url"
  gh issue comment "$ISSUE_NUMBER" --body "**Spell check follow-up:** $pr_url"
  add_label "$SPELL_LABEL"
}

# ─── 6. Test-coverage ai-implement issue ─────────────────────────────────────

handle_tests() {
  if issue_has_label "$TESTS_LABEL"; then
    log "Tests step already done — skipping"
    return 0
  fi

  if [ "$TESTS_COUNT" -eq 0 ]; then
    log "No test gaps worth actioning — marking done"
    gh issue comment "$ISSUE_NUMBER" --body "**Test coverage:** no actionable gaps after filtering mocks/types/trivial files."
    add_label "$TESTS_LABEL"
    return 0
  fi

  log "Building ai-implement issue for $TESTS_COUNT untested file(s)"

  local file_list
  file_list=$(awk -F'\t' '{printf "- `%s` (%s lines)\n", $1, $2}' "$WORK/test-gaps.txt")

  local body
  body=$(cat <<EOF
## Test Coverage Backfill

Source: #${ISSUE_NUMBER} (weekly code-health report)

Write Vitest + React Testing Library tests for the following files that
currently have no co-located test:

${file_list}

### Scope
- Cover user-facing rendering and interaction
- For Server Components, prefer testing the data-shape contract
- Tests must pass \`cd web && pnpm test\`
- Follow patterns in existing \`*.test.tsx\` files
- Match formatting/lint conventions in \`AGENTS.md\` and \`.agents/skills/coding-standards.md\`

### Out of scope (already filtered)
- \`src/__mocks__/\` (mocks)
- \`src/types/\` (type-only)
- Re-export \`index.ts\` files
- Files under 15 lines

### Acceptance
- \`pnpm test\` passes
- Each listed file has a corresponding \`*.test.ts(x)\` next to it
- No skipped or focused tests committed
EOF
)

  local issue_url
  issue_url=$(GH_TOKEN="$GH_PR_CREATE_TOKEN" gh issue create \
    --title "test: backfill missing tests from code-health #${ISSUE_NUMBER}" \
    --label 'ai-implement' \
    --body "$body")

  log "Opened ai-implement issue: $issue_url"
  gh issue comment "$ISSUE_NUMBER" --body "**Test coverage follow-up:** $issue_url"
  add_label "$TESTS_LABEL"
}

# ─── 7. Close report when both steps done ────────────────────────────────────

maybe_close() {
  if issue_has_label "$SPELL_LABEL" && issue_has_label "$TESTS_LABEL"; then
    log "Both follow-ups dispatched — closing report"
    gh issue comment "$ISSUE_NUMBER" --body "All follow-up actions dispatched. Closing this report."
    gh issue close "$ISSUE_NUMBER" --reason completed
  else
    log "Not closing — one or more steps still pending"
  fi
}

handle_spell
handle_tests
maybe_close

log "Done"
