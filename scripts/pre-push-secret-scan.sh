#!/bin/bash
set -euo pipefail

if ! command -v gitleaks >/dev/null 2>&1; then
  echo "gitleaks not found, skipping local secret scan"
  exit 0
fi

# Scan all commits being pushed, not just HEAD.
# Compute range: merge-base with remote tracking branch..HEAD.
# Falls back to full history scan if no remote ref exists yet (new branch).
_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "HEAD")
_log_opts="--no-merges"
for _candidate in "origin/$_branch" "origin/main" "origin/master"; do
  if git rev-parse --verify "$_candidate" >/dev/null 2>&1; then
    _base=$(git merge-base "$_candidate" HEAD 2>/dev/null || true)
    if [ -n "$_base" ]; then
      _log_opts="--no-merges ${_base}..HEAD"
      break
    fi
  fi
done

tmp_report="$(mktemp)"
trap 'rm -f "$tmp_report"' EXIT

run_gitleaks() {
  if gitleaks help git >/dev/null 2>&1; then
    gitleaks git --no-banner --redact --log-opts="$_log_opts" --report-format=json --report-path="$tmp_report" .
    return
  fi

  if gitleaks help detect >/dev/null 2>&1; then
    gitleaks detect --no-banner --redact --source . --log-opts="$_log_opts" --report-format=json --report-path="$tmp_report"
    return
  fi

  echo "gitleaks is installed but its CLI is not recognized; skipping local secret scan"
  exit 0
}

if run_gitleaks; then
  exit 0
fi

echo ""
echo "╔──────────────────────────────────────────────────────╗"
echo "║  ✗  Potential secret detected by gitleaks.          ║"
echo "║     Review the current commit before pushing.       ║"
echo "╚──────────────────────────────────────────────────────╝"
echo ""

if [ -s "$tmp_report" ]; then
  echo "gitleaks report:"
  cat "$tmp_report"
fi

exit 1
