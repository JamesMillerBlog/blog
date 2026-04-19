#!/bin/bash
set -euo pipefail

review_dir=".claude/pre-push-review"
all_files="$review_dir/all-changed-files.txt"
output_file="$review_dir/static-checks.txt"

mkdir -p "$review_dir"

if [ ! -f "$all_files" ]; then
  bash scripts/pre-push-review-manifest.sh >/dev/null
fi

tmp_hits=$(mktemp)
trap 'rm -f "$tmp_hits"' EXIT

: >"$output_file"

append_matches() {
  local title="$1"
  local severity="$2"
  local pattern="$3"
  shift 3

  : >"$tmp_hits"
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    [ -f "$file" ] || continue
    rg -n -H -e "$pattern" "$file" >>"$tmp_hits" 2>/dev/null || true
  done <"$all_files"

  if [ -s "$tmp_hits" ]; then
    echo "[$severity] $title" >>"$output_file"
    cat "$tmp_hits" >>"$output_file"
    echo "" >>"$output_file"
  fi
}

append_matches "Possible hardcoded secrets" "HIGH" '(AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{20,}|ghp_[0-9A-Za-z]{20,}|xox[baprs]-[0-9A-Za-z-]{10,}|(api|secret|access)[_-]?(key|token)["'"'"' ]*[:=]["'"'"' ]*[A-Za-z0-9_\/+=.-]{12,})'
append_matches "Dangerous code execution primitives" "HIGH" '(dangerouslySetInnerHTML|eval\(|execSync\(|spawnSync\(|exec\(|child_process)'
append_matches "Shell pipe to sh/bash" "HIGH" 'curl[^[:cntrl:]]*\|[[:space:]]*(sh|bash)'
append_matches "Overly broad GitHub Actions permissions" "HIGH" 'permissions:[[:space:]]*write-all'
append_matches "Unpinned GitHub Actions" "MEDIUM" 'uses:[[:space:]]*[^@[:space:]]+@v?[0-9]+(\.[0-9]+)*$'
append_matches "Potential debug logging" "LOW" '(console\.log\(|print_r\(|var_dump\()'
append_matches "Hardcoded black or hex colors" "LOW" '(#000000\b|#000\b|[[:<:]]black[[:>:]])'
append_matches "1px border usage" "LOW" '1px[[:space:]]+solid'

{
  echo "Deterministic static checks"
  echo ""
  if [ -s "$output_file" ]; then
    cat "$output_file"
  else
    echo "No static-check hits."
  fi
} >"$output_file.tmp"

mv "$output_file.tmp" "$output_file"
cat "$output_file"
