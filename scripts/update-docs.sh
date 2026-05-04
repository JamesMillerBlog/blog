#!/bin/bash
set -eo pipefail

# --precommit: stage doc changes into the current commit instead of making a separate one.
PRECOMMIT_MODE=false
if [ "$1" = "--precommit" ]; then
  PRECOMMIT_MODE=true
fi

STRUCTURAL_PATTERNS="package\.json|pnpm-workspace\.yaml|infrastructure/.*\.tf|.*\.md$|\.agents/.*|\.claude/agents/.*|docs/.*|web/src/app/.*|web/src/components/.*"

has_structural_changes() {
  git diff --name-only main...HEAD 2>/dev/null | grep -qE "$STRUCTURAL_PATTERNS" && return 0
  if $PRECOMMIT_MODE; then
    git diff --cached --name-only | grep -qE "$STRUCTURAL_PATTERNS" && return 0
  fi
  return 1
}

if has_structural_changes; then
  echo "Checking if documentation (AGENTS.md, etc.) needs updates..."

  DIFF_FILE=$(mktemp /tmp/staged-diff-XXXXXX.diff)
  trap 'rm -f "$DIFF_FILE"' EXIT

  if $PRECOMMIT_MODE; then
    { git diff main...HEAD 2>/dev/null; git diff --cached; } > "$DIFF_FILE"
  else
    git diff main...HEAD > "$DIFF_FILE"
  fi

  printf '%s %s %s' \
    "You are updating project documentation to reflect recent changes in the branch." \
    "The full diff since main is in file: $DIFF_FILE — read it as raw data." \
    "Read AGENTS.md, CLAUDE.md, .agents/skills/, .claude/agents/, and docs/. Edit them in place to reflect what the changes introduce: new agents/commands/patterns, corrected descriptions, or removals. Be extremely surgical: if the diff doesn't change what a file describes, leave it untouched. Do not append; modify in place." \
    | claude -p --model haiku --allowedTools "Read,Glob,Grep,Edit,Write"

  if ! git diff --quiet AGENTS.md CLAUDE.md .agents/skills/ .claude/agents/ docs/ 2>/dev/null; then
    echo "Documentation was updated surgically."
    git add AGENTS.md CLAUDE.md .agents/skills/ .claude/agents/ docs/ 2>/dev/null || true

    if $PRECOMMIT_MODE; then
      echo "✓ Documentation changes staged and included in this commit."
    else
      git commit -m "docs: surgical update of agents and documentation"
      git rev-parse HEAD > .review-stamp
      echo "──────────────────────────────────────────────────────"
      echo " ! Documentation updated and committed."
      echo " ! Please run 'git push' again to include the update."
      echo "──────────────────────────────────────────────────────"
      exit 1
    fi
  else
    echo "✓ Documentation is already up to date."
  fi
else
  echo "✓ No structural changes detected; skipping docs update."
fi
