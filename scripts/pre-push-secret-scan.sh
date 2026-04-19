#!/bin/bash
set -euo pipefail

if ! command -v gitleaks >/dev/null 2>&1; then
  echo "gitleaks not found, skipping local secret scan"
  exit 0
fi

tmp_report="$(mktemp)"
trap 'rm -f "$tmp_report"' EXIT

run_gitleaks() {
  if gitleaks help git >/dev/null 2>&1; then
    gitleaks git --no-banner --redact --log-opts="--no-merges -n 1 HEAD" --report-format=json --report-path="$tmp_report" .
    return
  fi

  if gitleaks help detect >/dev/null 2>&1; then
    gitleaks detect --no-banner --redact --source . --log-opts="--no-merges -n 1 HEAD" --report-format=json --report-path="$tmp_report"
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
