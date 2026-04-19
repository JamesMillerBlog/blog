#!/bin/bash
set -euo pipefail

out_dir=".claude/pre-push-review"
mkdir -p "$out_dir"

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)
base_ref=""
merge_base=""

for candidate in "origin/$branch" "origin/main" "origin/master"; do
  if git rev-parse --verify "$candidate" >/dev/null 2>&1; then
    base_ref="$candidate"
    merge_base=$(git merge-base "$candidate" HEAD 2>/dev/null || true)
    [ -n "$merge_base" ] && break
  fi
done

branch_files_tmp=$(mktemp)
staged_files_tmp=$(mktemp)
combined_tmp=$(mktemp)
numstat_tmp=$(mktemp)
trap 'rm -f "$branch_files_tmp" "$staged_files_tmp" "$combined_tmp" "$numstat_tmp"' EXIT

if [ -n "$merge_base" ]; then
  git diff --name-only "$merge_base"...HEAD >"$branch_files_tmp" || true
  git diff --numstat "$merge_base"...HEAD >"$numstat_tmp" || true
else
  : >"$branch_files_tmp"
  : >"$numstat_tmp"
fi

git diff --cached --name-only >"$staged_files_tmp" || true
git diff --cached --numstat >>"$numstat_tmp" || true

cat "$branch_files_tmp" "$staged_files_tmp" | sed '/^$/d' | sort -u >"$combined_tmp"

all_files="$out_dir/all-changed-files.txt"
security_files="$out_dir/security-files.txt"
quality_files="$out_dir/code-quality-files.txt"
frontend_files="$out_dir/frontend-files.txt"
design_files="$out_dir/design-files.txt"
infra_files="$out_dir/infrastructure-files.txt"
manifest_file="$out_dir/manifest.txt"

: >"$all_files"
: >"$security_files"
: >"$quality_files"
: >"$frontend_files"
: >"$design_files"
: >"$infra_files"

is_docs_only_path() {
  case "$1" in
    *.md|*.txt|*.rst|*.adoc|*.svg|*.png|*.jpg|*.jpeg|*.gif|*.webp|docs/*|README*|CHANGELOG*|LICENSE*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

is_high_risk_path() {
  case "$1" in
    .github/workflows/*|Dockerfile|docker-compose*|docker/*|infrastructure/*|*.tf|*.tfvars|package.json|pnpm-workspace.yaml|*.npmrc|scripts/deploy.*|scripts/*deploy*|scripts/*upload*|scripts/*publish*|*auth*|*secret*|*.env|*.env.*|*middleware*|*webhook*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

is_frontend_path() {
  case "$1" in
    *.tsx|*.ts|*.jsx|*.js|*.css)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

is_design_path() {
  case "$1" in
    *.css|*.tsx|*.jsx)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

is_quality_path() {
  case "$1" in
    *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.json|*.yml|*.yaml|*.sh|*.tf|*.tfvars|Dockerfile|docker-compose*|package.json|pnpm-workspace.yaml|*.mdx|*.css)
      return 0
      ;;
    scripts/*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

file_count=0
docs_only=true
has_high_risk=false
has_frontend=false
has_design=false
has_infra=false

while IFS= read -r file; do
  [ -z "$file" ] && continue
  file_count=$((file_count + 1))
  printf '%s\n' "$file" >>"$all_files"
  printf '%s\n' "$file" >>"$security_files"

  if ! is_docs_only_path "$file"; then
    docs_only=false
  fi

  if is_high_risk_path "$file"; then
    has_high_risk=true
    has_infra=true
    printf '%s\n' "$file" >>"$infra_files"
  elif case "$file" in *.yml|*.yaml|*.tf|*.tfvars) true ;; *) false ;; esac; then
    has_infra=true
    printf '%s\n' "$file" >>"$infra_files"
  fi

  if is_quality_path "$file" && ! is_docs_only_path "$file"; then
    printf '%s\n' "$file" >>"$quality_files"
  fi

  if is_frontend_path "$file"; then
    has_frontend=true
    printf '%s\n' "$file" >>"$frontend_files"
  fi

  if is_design_path "$file"; then
    has_design=true
    printf '%s\n' "$file" >>"$design_files"
  fi
done <"$combined_tmp"

review_mode="docs-only"
if [ "$docs_only" = false ]; then
  review_mode="app"
fi
if [ "$has_high_risk" = true ]; then
  review_mode="infra/high-risk"
fi

sort -u -o "$security_files" "$security_files"
sort -u -o "$quality_files" "$quality_files"
sort -u -o "$frontend_files" "$frontend_files"
sort -u -o "$design_files" "$design_files"
sort -u -o "$infra_files" "$infra_files"

diff_lines=0
if [ -s "$numstat_tmp" ]; then
  diff_lines=$(awk '{ add += ($1 ~ /^[0-9]+$/ ? $1 : 0); del += ($2 ~ /^[0-9]+$/ ? $2 : 0) } END { print add + del + 0 }' "$numstat_tmp")
fi

large_change="no"
if [ "$file_count" -gt 15 ] || [ "$diff_lines" -gt 400 ]; then
  large_change="yes"
fi

{
  echo "Review mode: $review_mode"
  echo "Base ref: ${base_ref:-none}"
  echo "Merge base: ${merge_base:-none}"
  echo "Changed files: $file_count"
  echo "Changed lines: $diff_lines"
  echo "Large change: $large_change"
  echo "Has frontend files: $has_frontend"
  echo "Has design files: $has_design"
  echo "Has infrastructure files: $has_infra"
  echo ""
  echo "Paths:"
  echo "- All files: $all_files"
  echo "- Security files: $security_files"
  echo "- Code quality files: $quality_files"
  echo "- Frontend files: $frontend_files"
  echo "- Design files: $design_files"
  echo "- Infrastructure files: $infra_files"
} >"$manifest_file"

cat "$manifest_file"
