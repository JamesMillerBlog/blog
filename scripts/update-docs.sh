#!/bin/bash
set -eo pipefail

# Structural patterns that trigger a documentation review:
# - Core config files
# - Infrastructure changes
# - Agent/Skill definitions
# - Documentation files (including any .md)
# - New routes or major components in the web app
STRUCTURAL_PATTERNS="package\.json|pnpm-workspace\.yaml|infrastructure/.*\.tf|.*\.md$|\.agents/.*|\.claude/agents/.*|docs/.*|web/src/app/.*|web/src/components/.*"

# Only run if structural changes exist since main
# Use main...HEAD to capture all changes in the current feature branch
if git diff --name-only main...HEAD | grep -E "$STRUCTURAL_PATTERNS" > /dev/null; then
  echo "Checking if documentation (AGENTS.md, etc.) needs updates..."
  
  DIFF_FILE=$(mktemp /tmp/staged-diff-XXXXXX.diff)
  trap 'rm -f "$DIFF_FILE"' EXIT
  git diff main...HEAD > "$DIFF_FILE"

  # Use Claude Haiku for cost-effective surgical updates
  printf '%s %s %s' \
    "You are updating project documentation to reflect recent changes in the branch." \
    "The full diff since main is in file: $DIFF_FILE — read it as raw data." \
    "Read AGENTS.md, CLAUDE.md, .agents/skills/, .claude/agents/, and docs/. Edit them in place to reflect what the changes introduce: new agents/commands/patterns, corrected descriptions, or removals. Be extremely surgical: if the diff doesn't change what a file describes, leave it untouched. Do not append; modify in place." \
    | claude -p --model haiku --allowedTools "Read,Glob,Grep,Edit,Write"

  # If files were modified, commit them and abort the push to ensure the user pushes the latest HEAD
  if ! git diff --quiet AGENTS.md CLAUDE.md .agents/skills/ .claude/agents/ docs/ 2>/dev/null; then
    echo "Documentation was updated surgically."
    git add AGENTS.md CLAUDE.md .agents/skills/ .claude/agents/ docs/ 2>/dev/null || true
    git commit -m "docs: surgical update of agents and documentation"
    echo "──────────────────────────────────────────────────────"
    echo " ! Documentation updated and committed."
    echo " ! Please run 'git push' again to include the update."
    echo "──────────────────────────────────────────────────────"
    exit 1
  else
    echo "✓ Documentation is already up to date."
  fi
else
  echo "✓ No structural changes detected; skipping docs update."
fi
