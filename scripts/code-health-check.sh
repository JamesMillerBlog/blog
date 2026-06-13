#!/bin/bash
set -euo pipefail

# ─── Code Health Check ───────────────────────────────────────────────────────
# Runs locally or via weekly GitHub workflow.
# Combines static analysis, dead-code detection, test-gap analysis, and
# AI-driven best-practice review into a single comprehensive report.
#
# Usage:
#   ./scripts/code-health-check.sh              # full run
#   ./scripts/code-health-check.sh --quick      # skip AI review
#   ./scripts/code-health-check.sh --ci         # CI mode: write PR/issue
#   CI=true ./scripts/code-health-check.sh      # also CI mode
#
# Prerequisites:
#   - Node.js 22+, pnpm 10+, pi (AI harness)
#   - env Vars (CI only): GH_TOKEN, GEMINI_API_KEY (or pi model creds)
# ──────────────────────────────────────────────────────────────────────────────

QUICK_MODE=false
CI_MODE="${CI:-false}"
for arg in "$@"; do
  case "$arg" in
  --quick) QUICK_MODE=true ;;
  --ci) CI_MODE=true ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

REPORT_DIR="$PROJECT_ROOT/.code-health"
rm -rf "$REPORT_DIR"
mkdir -p "$REPORT_DIR"

REPORT="$REPORT_DIR/report.md"
PASS=0
FAIL=0
WARN=0
STAGE_START=0

# ─── Helpers ─────────────────────────────────────────────────────────────────

green() { printf '\033[0;32m%s\033[0m\n' "$*"; }
red() { printf '\033[0;31m%s\033[0m\n' "$*"; }
yellow() { printf '\033[0;33m%s\033[0m\n' "$*"; }
bold() { printf '\033[1m%s\033[0m\n' "$*"; }

stage() {
  STAGE_START=$(date +%s)
  bold ""
  bold "━━━ $* ━━━"
  echo "" >>"$REPORT"
  echo "## $*" >>"$REPORT"
  echo "" >>"$REPORT"
}

stage_done() {
  local elapsed=$(($(date +%s) - STAGE_START))
  green "  ✓ done (${elapsed}s)"
}

pass() {
  PASS=$((PASS + 1))
  green "  ✓ PASS — $*"
  echo "- ✅ **PASS** — $*" >>"$REPORT"
}

fail() {
  FAIL=$((FAIL + 1))
  red "  ✗ FAIL — $*"
  echo "- ❌ **FAIL** — $*" >>"$REPORT"
}

warn() {
  WARN=$((WARN + 1))
  yellow "  ⚠ WARN — $*"
  echo "- ⚠️ **WARN** — $*" >>"$REPORT"
}

# ─── Prerequisites ───────────────────────────────────────────────────────────

stage "0. Prerequisites"

if ! command -v node &>/dev/null; then
  fail "Node.js not found"
  exit 1
fi
pass "Node.js $(node -v)"

if ! command -v pnpm &>/dev/null; then
  fail "pnpm not found"
  exit 1
fi
pass "pnpm $(pnpm -v)"

stage_done

# ─── 1. Static Analysis ──────────────────────────────────────────────────────

stage "1. Static Analysis"

cd "$PROJECT_ROOT/web"

echo "  → Installing dependencies (if needed)..."
pnpm install --frozen-lockfile --silent 2>&1 | tail -1 || true

echo "  → Format check..."
if pnpm format:check >/dev/null 2>&1; then
  pass "Prettier format check"
else
  fail "Prettier format check — run 'pnpm format' to fix"
fi

echo "  → Lint..."
if pnpm lint >/dev/null 2>&1; then
  pass "ESLint"
else
  fail "ESLint — run 'pnpm lint' for details"
fi

echo "  → Type check..."
if pnpm typecheck >/dev/null 2>&1; then
  pass "TypeScript type check (tsc --noEmit)"
else
  fail "TypeScript type check — run 'pnpm typecheck' for details"
fi

stage_done
cd "$PROJECT_ROOT"

# ─── 2. Dead Code Detection ──────────────────────────────────────────────────

stage "2. Dead Code Detection"

# ── 2a. knip — unused files, exports, dependencies ──

# When unused files are found, xargs fails because knip --reporter json
# exits with a non-zero code. Use temporary file to capture output and
# report manually.

echo "  → Running knip on web/..."
cd "$PROJECT_ROOT/web"

if pnpm exec knip --reporter json >"$REPORT_DIR/knip.json" 2>"$REPORT_DIR/knip.err"; then
  pass "knip — no unused files, exports, or dependencies"
else
  echo "  → knip found unused items (parsing output)..."

  # knip JSON structure: { "issues": [ { "file": "...", "files": [...],
  # "exports": [...], "devDependencies": [...], ... } ] }
  # Each file-level issue object has arrays for each category of unused items.
  KFILES=$(python3 -c "
import json, sys
try:
    d = json.load(open('$REPORT_DIR/knip.json'))
    issues = d.get('issues', [])
    total = 0
    ignore = {'binaries', 'catalog', 'optionalPeerDependencies', 'unlisted', 'unresolved', 'namespaceMembers', 'duplicates', 'types'}
    for issue in issues:
        for k, v in issue.items():
            if k in ignore or k == 'file':
                continue
            if isinstance(v, list):
                total += len(v)
    print(total)
except: print(0)
" 2>/dev/null || echo "0")

  if [ "$KFILES" -gt 0 ]; then
    warn "knip — ${KFILES} unused items (files, exports, deps) — see ${REPORT_DIR}/knip.json"

    # Extract human-readable summary grouped by issue type
    python3 -c "
import json
from collections import defaultdict
d = json.load(open('$REPORT_DIR/knip.json'))
issues = d.get('issues', [])
ignore = {'binaries', 'catalog', 'optionalPeerDependencies', 'unlisted', 'unresolved', 'namespaceMembers', 'duplicates', 'types'}
by_type = defaultdict(list)
for issue in issues:
    fname = issue.get('file', '?')
    for k, v in issue.items():
        if k in ignore or k == 'file':
            continue
        if isinstance(v, list) and v:
            for item in v:
                name = item.get('name', str(item)) if isinstance(item, dict) else str(item)
                by_type[k].append((fname, name))
for cat, items in sorted(by_type.items()):
    print(f'### {cat} ({len(items)} items)')
    for fname, name in items[:15]:
        print(f'- \`{fname}\` → \`{name}\`')
    if len(items) > 15:
        print(f'  ... and {len(items)-15} more')
    print()
" >"$REPORT_DIR/knip-summary.txt" 2>/dev/null || true

  else
    pass "knip — clean (exit code was non-zero but no unused items)"
  fi

  # Include the knip error log if it has useful content
  if [ -s "$REPORT_DIR/knip.err" ]; then
    {
      echo "### knip stderr"
      echo '```'
      cat "$REPORT_DIR/knip.err"
      echo '```'
      echo ""
    } >>"$REPORT"
  fi
fi
cd "$PROJECT_ROOT"


stage_done

# ─── 3. Test Coverage & Gap Analysis ─────────────────────────────────────────

stage "3. Test Coverage & Gap Analysis"

cd "$PROJECT_ROOT/web"

echo "  → Running vitest with coverage..."
if pnpm test:coverage >/dev/null 2>&1; then
  pass "All tests pass"
else
  fail "Some tests failed — run 'pnpm test' for details"
fi

# Map source files vs test files to find untested modules
echo "  → Analyzing test gaps..."
python3 -c "
import os, json

src_dir = 'src'
test_suffixes = ('.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx')

def find_files(root, exts=('.ts', '.tsx')):
    result = []
    for dirpath, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d != '__snapshots__']
        for f in files:
            if f.endswith(exts) and not f.endswith(test_suffixes) and 'node_modules' not in dirpath:
                result.append(os.path.join(dirpath, f))
    return sorted(result)

def has_test(src_file):
    base = src_file.rsplit('.', 1)[0]
    for suffix in test_suffixes:
        if os.path.exists(base + suffix):
            return True
    return False

source_files = find_files(src_dir)
with_test = [f for f in source_files if has_test(f)]
without_test = [f for f in source_files if not has_test(f)]

print(f'Total source files: {len(source_files)}')
print(f'Files with tests:   {len(with_test)}')
print(f'Files without tests: {len(without_test)}')
print(f'Test coverage:       {len(with_test)/max(len(source_files),1)*100:.0f}%')
print()
if without_test:
    print('Files without tests:')
    for f in without_test:
        # Estimate lines
        try:
            lines = len(open(f).readlines())
            print(f'  {f} ({lines} lines)')
        except:
            print(f'  {f}')
" >"$REPORT_DIR/test-gaps.txt" 2>/dev/null

cat "$REPORT_DIR/test-gaps.txt" | while IFS= read -r line; do
  echo "  $line"
done

# Count untested files
UNTESTED=$(grep -c '^  src/' "$REPORT_DIR/test-gaps.txt" 2>/dev/null || echo "0")
TESTED=$(grep 'Files with tests:' "$REPORT_DIR/test-gaps.txt" | grep -o '[0-9]\+' || echo "0")
TOTAL_FILES=$(grep 'Total source files:' "$REPORT_DIR/test-gaps.txt" | grep -o '[0-9]\+' || echo "0")

if [ "$UNTESTED" -eq 0 ] 2>/dev/null; then
  pass "Every source file has a corresponding test"
else
  warn "${UNTESTED} of ${TOTAL_FILES} source files have no tests (${TESTED} have tests)"
fi

stage_done
cd "$PROJECT_ROOT"

# ─── 4. Copy-Paste Detection ─────────────────────────────────────────────────

stage "4. Copy-Paste Detection"

echo "  → Running jscpd..."
cd "$PROJECT_ROOT/web"

# jscpd exits 1 when clones found — that's expected
if pnpm exec jscpd --pattern 'src/**/*.ts' --pattern 'src/**/*.tsx' \
  --minTokens 50 --minLines 5 \
  --reporters json --output "../$REPORT_DIR" \
  >/dev/null 2>&1; then
  pass "jscpd — no significant code duplication"
else
  CLONE_COUNT=$(python3 -c "
import json
try:
    d = json.load(open('../$REPORT_DIR/jscpd-report.json'))
    total = sum(len(f.get('duplicates', [])) for f in d.get('files', []))
    print(total)
except: print(0)
" 2>/dev/null || echo "0")

  if [ "$CLONE_COUNT" -gt 0 ]; then
    warn "jscpd — ${CLONE_COUNT} duplicate blocks found — see ${REPORT_DIR}/jscpd-report.json"
  else
    pass "jscpd — clean"
  fi
fi
cd "$PROJECT_ROOT"

stage_done

# ─── 5. Bundle Size Check ────────────────────────────────────────────────────

stage "5. Build Check"
cd "$PROJECT_ROOT/web"

# Ensure _posts has at least one post — Next.js output:export rejects dynamic
# routes with empty generateStaticParams(), even if that's a valid runtime state.
PLACEHOLDER_POST="_posts/ci-placeholder.mdx"
PLACEHOLDER_CREATED=false
if [ ! -d "_posts" ] || [ -z "$(ls _posts/*.mdx 2>/dev/null)" ]; then
  mkdir -p _posts
  printf -- '---\ntitle: CI Placeholder\ndate: "2024-01-01"\ncoverImage: /placeholder.jpg\nauthor:\n  name: CI\n  picture: /placeholder.jpg\nexcerpt: Placeholder post for CI builds.\nogImage:\n  url: /placeholder.jpg\n---\nPlaceholder.\n' \
    > "$PLACEHOLDER_POST"
  PLACEHOLDER_CREATED=true
fi

echo "  → Running next build (this may take a minute)..."
if pnpm build >/dev/null 2>&1; then
  pass "Next.js build succeeds"
else
  fail "Next.js build failed"
fi

[ "$PLACEHOLDER_CREATED" = true ] && rm -f "$PLACEHOLDER_POST"

stage_done
cd "$PROJECT_ROOT"

# ─── 6. Outdated Dependencies ────────────────────────────────────────────────

stage "6. Outdated Dependencies"

cd "$PROJECT_ROOT/web"

echo "  → Checking for outdated packages..."
pnpm outdated --format json >"$REPORT_DIR/outdated.json" 2>/dev/null || true

if [ -f "$REPORT_DIR/outdated.json" ] && [ -s "$REPORT_DIR/outdated.json" ]; then
  OUTDATED_COUNT=$(python3 -c "
import json
try:
    d = json.load(open('$REPORT_DIR/outdated.json'))
    print(len(d))
except: print(0)
" 2>/dev/null || echo "0")

  if [ "$OUTDATED_COUNT" -gt 0 ] 2>/dev/null; then
    warn "${OUTDATED_COUNT} outdated packages — see ${REPORT_DIR}/outdated.json"
    python3 -c "
import json
d = json.load(open('$REPORT_DIR/outdated.json'))
for name, info in sorted(d.items()):
    current = info.get('current', '?')
    latest = info.get('latest', '?')
    wanted = info.get('wanted', '?')
    dep_type = info.get('type', '?')
    print(f'  - {name}: {current} → {latest} (wanted: {wanted}) [{dep_type}]')
"
  else
    pass "All packages up to date"
  fi
else
  pass "All packages up to date"
fi

stage_done
cd "$PROJECT_ROOT"

# ─── 7. Git Churn Analysis ───────────────────────────────────────────────────

stage "7. Git Churn Analysis"

echo "  → Analyzing file change frequency (last 90 days)..."

# Top 15 most-changed files — high churn = potential design/quality issues
git log --since="90 days ago" --format=format: --name-only 2>/dev/null |
  grep -v '^$' | sort | uniq -c | sort -nr | head -15 >"$REPORT_DIR/churn.txt" || true

if [ -s "$REPORT_DIR/churn.txt" ]; then
  CHURN_TOP=$(head -5 "$REPORT_DIR/churn.txt" | awk '{sum+=$1} END{print sum}')
  echo "  Top 5 files: ${CHURN_TOP} combined changes"
  {
    echo "Files changed most often in last 90 days:"
    echo ""
    echo "| Changes | File |"
    echo "|---------|------|"
    cat "$REPORT_DIR/churn.txt" | head -15 | while read -r count file; do
      echo "| $count | \`$file\` |"
    done
    echo ""
    echo "> High churn files may indicate unstable code, design issues,"
    echo "> or missing abstractions. Consider refactoring."
  } >"$REPORT_DIR/churn-summary.md"
  warn "Churn report generated — see ${REPORT_DIR}/churn-summary.md"
else
  pass "Insufficient git history for churn analysis"
fi

stage_done

# ─── 8. Spell Check ──────────────────────────────────────────────────────────

stage "8. Spell Check"

cd "$PROJECT_ROOT/web"

echo "  → Running cspell on source files..."
if pnpm exec cspell "src/**/*.{ts,tsx}" --no-progress --unique \
  >"$REPORT_DIR/spell.txt" 2>"$REPORT_DIR/spell.err"; then
  pass "No spelling errors"
else
  # Filter out non-spelling output (e.g. Node.js version warnings from cspell stderr)
  grep -v '^Unsupported' "$REPORT_DIR/spell.txt" >"$REPORT_DIR/spell-filtered.txt" 2>/dev/null || true
  mv "$REPORT_DIR/spell-filtered.txt" "$REPORT_DIR/spell.txt"
  SPELL_COUNT=$(wc -l <"$REPORT_DIR/spell.txt" 2>/dev/null || echo "0")
  if [ "$SPELL_COUNT" -gt 0 ] 2>/dev/null; then
    warn "${SPELL_COUNT} potential spelling errors — see ${REPORT_DIR}/spell.txt"
    echo "  Sample:"
    head -10 "$REPORT_DIR/spell.txt" | while read -r line; do
      echo "    $line"
    done
  else
    pass "No spelling errors"
  fi
fi

stage_done
cd "$PROJECT_ROOT"

# ─── 9. Repo Structure Audit ─────────────────────────────────────────────────

stage "9. Repo Structure Audit"

echo "  → Checking for duplicate tool config files..."

# Tools that support multiple config file formats — only one should exist
DUPLICATE_FOUND=0
check_duplicate_configs() {
  local tool="$1"
  shift
  local found=()
  for pattern in "$@"; do
    # shellcheck disable=SC2086
    matches=$(ls $pattern 2>/dev/null | head -1 || true)
    [ -n "$matches" ] && found+=("$matches")
  done
  if [ "${#found[@]}" -gt 1 ]; then
    DUPLICATE_FOUND=$((DUPLICATE_FOUND + 1))
    warn "Duplicate $tool config: ${found[*]} — remove all but one"
  fi
}

cd "$PROJECT_ROOT"
check_duplicate_configs "Prettier"    ".prettierrc" ".prettierrc.json" ".prettierrc.js" ".prettierrc.ts" "prettier.config.js" "prettier.config.ts"
check_duplicate_configs "ESLint"      ".eslintrc" ".eslintrc.json" ".eslintrc.js" ".eslintrc.yml" "eslint.config.js" "eslint.config.mjs" "web/.eslintrc" "web/.eslintrc.json" "web/eslint.config.mjs"
check_duplicate_configs "commitlint"  ".commitlintrc" ".commitlintrc.json" ".commitlintrc.js" "commitlint.config.js" "commitlint.config.ts"
check_duplicate_configs "Babel"       ".babelrc" ".babelrc.json" ".babelrc.js" "babel.config.js" "babel.config.ts"
check_duplicate_configs "Jest"        "jest.config.js" "jest.config.ts" "jest.config.mjs"
check_duplicate_configs "PostCSS"     "postcss.config.js" "postcss.config.ts" "postcss.config.mjs" "web/postcss.config.js" "web/postcss.config.ts"

if [ "$DUPLICATE_FOUND" -eq 0 ]; then
  pass "No duplicate tool config files found"
fi

echo "  → Checking generated output directories are gitignored..."
GITIGNORE_MISSING=0
check_gitignored() {
  local dir="$1"
  if [ -d "$PROJECT_ROOT/$dir" ]; then
    if ! git -C "$PROJECT_ROOT" check-ignore -q "$dir" 2>/dev/null; then
      warn "'$dir/' exists but is not gitignored — likely generated output"
      GITIGNORE_MISSING=$((GITIGNORE_MISSING + 1))
    fi
  fi
}

check_gitignored ".code-health"
check_gitignored ".next"
check_gitignored "web/.next"
check_gitignored "web/out"
check_gitignored "web/coverage"
check_gitignored "web/dist"
check_gitignored ".turbo"
check_gitignored "web/.turbo"

if [ "$GITIGNORE_MISSING" -eq 0 ]; then
  pass "All generated output directories are gitignored"
fi

echo "  → Root directory inventory..."
ROOT_FILE_COUNT=$(find "$PROJECT_ROOT" -maxdepth 1 -not -name '.*' -not -name '.' | wc -l)
ROOT_HIDDEN_COUNT=$(find "$PROJECT_ROOT" -maxdepth 1 -name '.*' -not -name '.' -not -name '.git' | wc -l)
echo "  Root: ${ROOT_FILE_COUNT} visible items, ${ROOT_HIDDEN_COUNT} hidden config items"
{
  echo "### Root directory (visible files/dirs)"
  find "$PROJECT_ROOT" -maxdepth 1 -not -name '.*' -not -name '.' | sort | while read -r f; do
    echo "- \`$(basename "$f")\`"
  done
} >"$REPORT_DIR/root-inventory.txt"
warn "Root inventory written — review ${REPORT_DIR}/root-inventory.txt for anything unexpected"

stage_done

# ─── 10. AI-Driven Deep Review ───────────────────────────────────────────────

if [ "$QUICK_MODE" = true ]; then
  stage "10. AI Deep Review — SKIPPED (--quick mode)"
  echo "Re-run without --quick for AI pattern analysis." >>"$REPORT"
  stage_done
else
  stage "10. AI-Driven Deep Review"

  echo "  → Running AI analysis of codebase patterns..."

  if ! command -v pi &>/dev/null; then
    warn "pi not available — skipping AI deep review (install pi harness for local runs)"
  else

  # Build context for AI
  cat >"$REPORT_DIR/ai-context.md" <<'EOFCONTEXT'
## Codebase Context

### Technology Stack
- Next.js 16+ (App Router), React 19, TypeScript 5.9
- Tailwind CSS 4.x, MDX content via next-mdx-remote
- Vitest (unit), Playwright (E2E)
- Design system: "Byte Mark" (see web/design/DESIGN.md)
- ESLint 9 flat config + Prettier

### Project Structure
- `web/src/app/` — App Router pages (page.tsx, layout.tsx)
- `web/src/app/_components/` — page-specific components
- `web/src/components/` — shared components (ui/, mdx/, navigation, footer)
- `web/src/common/` — utils, constants
- `web/src/lib/` — library code (imageLoader)
- `web/src/providers/` — context providers
- `web/src/types/` — TypeScript type definitions

### Coding Standards (per AGENTS.md)
- 2-space indent, spaces only
- Single quotes, no semicolons, trailing commas (Prettier)
- Functional components (no class components)
- Arrow functions preferred over function declarations
- Named exports for components, async functions for data fetching
- TypeScript strict mode

### Files Analyzed
EOFCONTEXT

  # Append test gap analysis
  echo "" >>"$REPORT_DIR/ai-context.md"
  cat "$REPORT_DIR/test-gaps.txt" >>"$REPORT_DIR/ai-context.md" 2>/dev/null || true

  # Append knip summary
  echo "" >>"$REPORT_DIR/ai-context.md"
  echo "### Dead Code (knip)" >>"$REPORT_DIR/ai-context.md"
  cat "$REPORT_DIR/knip-summary.txt" >>"$REPORT_DIR/ai-context.md" 2>/dev/null || echo "(none)" >>"$REPORT_DIR/ai-context.md"

  # Append jscpd summary if available
  if [ -f "$REPORT_DIR/jscpd-report.json" ]; then
    echo "" >>"$REPORT_DIR/ai-context.md"
    echo "### Copy-Paste Detection" >>"$REPORT_DIR/ai-context.md"
    python3 -c "
import json
d = json.load(open('$REPORT_DIR/jscpd-report.json'))
for f in d.get('files', [])[:5]:
    dups = f.get('duplicates', [])
    if dups:
        print(f'File: {f[\"name\"]} has {len(dups)} duplicate block(s)')
" >>"$REPORT_DIR/ai-context.md" 2>/dev/null || echo "Could not parse jscpd report" >>"$REPORT_DIR/ai-context.md"
  fi

  # ── 6a. AI Code Pattern Review ──
  echo "  → Running code pattern review..."

  AI_PROMPT="You are a senior TypeScript/React code reviewer performing a comprehensive
code health audit on a Next.js 16 blog application. Your analysis must be
concrete, file-specific, and actionable.

$(cat "$REPORT_DIR/ai-context.md")

## Instructions

Read key source files to understand patterns, then produce a structured audit
covering ALL of the following sections. Write your complete review to
\`/workspace/.code-health/ai-review.md\`.

### 1. Architecture & Code Organization
- Are concerns properly separated? (UI vs logic vs data access)
- Are there any God-objects, circular dependencies, or tight coupling?
- Is the directory structure intuitive?

### 2. TypeScript Patterns
- Check for \`any\` usage that should be typed
- Check for missing strict null checks, unsafe type assertions (as / !)
- Check for over-use of optional chaining that masks problems
- Are generics used where appropriate?

### 3. React Patterns
- Check for missing \`useMemo\`/\`useCallback\` where expensive
- Check for components that could be Server Components but are Client Components
- Check for inline object/function props that cause unnecessary re-renders
- Check for missing \`Suspense\` boundaries, error boundaries
- Check for proper use of \`'use client'\` vs Server Components
- Are there class components that should be functional?

### 4. Functional vs OOP Patterns
- Identify any class-based patterns that could be functional
- Check if arrow functions vs function declarations are used consistently
- Check for factory functions, closures, composition vs inheritance
- Flag any mutable module-level state that should be avoided

### 5. Error Handling & Resilience
- Check for missing try/catch on async operations
- Check for unhandled Promise rejections
- Check for fetch/API calls without error handling
- Check for null-safety in data access patterns

### 6. Performance
- Check for expensive computations that should be memoized
- Check for unnecessary re-renders
- Check for missing image optimization (next/image)
- Check for large client bundles (heavy dependencies)

### 7. Accessibility
- Check for missing aria labels on interactive elements
- Check for proper heading hierarchy
- Check for keyboard navigation support
- Check for color contrast issues against Byte Mark design tokens

### 8. Testing Gaps
Given the test-gap analysis above, identify the TOP 5 most valuable files to test
with justification (business logic, complex transform, data integrity, etc.).
Do NOT suggest tests for trivial glue code or pure markup.

### 9. Dead Code Candidates
From the knip analysis above, identify patterns: are there entire modules that
are never imported? Exports that are never used? Dependencies that are installed
but never referenced?

### 10. Modern Best Practices (2026)
Research and suggest:
- Should any patterns be updated? (e.g., React Server Components adoption,
  new Next.js features, Tailwind v4 patterns, TypeScript 5.9 features)
- Are there tools the project should adopt? (e.g., Biome replacing ESLint,
  Turbopack optimization, bundle analysis)
- Are any current dependencies deprecated or have better alternatives?
- Is the project using modern patterns like streaming, partial prerendering,
  React 19 features (use(), useOptimistic, etc.)?

### 11. Coding Standards
- Are coding standards (per AGENTS.md) followed consistently?
- Are there deviations from the functional-first approach?
- Suggest improvements to the standards themselves.

## Output Format

Write to \`/workspace/.code-health/ai-review.md\` using this structure:

\`\`\`markdown
# Code Health AI Audit

> Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

## Summary

[3-5 sentence overall assessment with a letter grade: A+ through F]

---

## 1. Architecture & Organization
[Findings with file references]

## 2. TypeScript Patterns
[Findings with file:line references]

## 3. React Patterns
[Findings with file:line references]

## 4. Functional Patterns
[Findings with file:line references]

## 5. Error Handling
[Findings with file:line references]

## 6. Performance
[Findings with file:line references]

## 7. Accessibility
[Findings with file:line references]

## 8. Testing Recommendations
[Top 5 files ranked by test value, with justification]

## 9. Dead Code
[Actionable list with file paths]

## 10. Modern Practices & Tools
[Researched suggestions with rationale]

## 11. Standards Compliance
[Findings and suggested standard improvements]

## Top Priority Actions
[Ranked top 5 actions by impact/effort ratio]

\`\`\`

Be specific. Cite exact file paths and line numbers. Do not be vague or generic.
Every finding must reference a real file in this codebase."

  printf '%s' "$AI_PROMPT" |
    pi --agent-team-subagent-skills disabled \
      --no-session \
      --model opencode-go/deepseek-v4-pro \
      2>&1 | tee "$REPORT_DIR/ai-run.log" | tail -30

  if [ -f "$REPORT_DIR/ai-review.md" ]; then
    REVIEW_LINES=$(wc -l <"$REPORT_DIR/ai-review.md")
    if [ "$REVIEW_LINES" -gt 20 ]; then
      pass "AI deep review complete (${REVIEW_LINES} lines)"
    else
      warn "AI review produced minimal output — may need manual review"
    fi
  else
    # AI didn't write to file — extract from log
    if [ -f "$REPORT_DIR/ai-run.log" ]; then
      grep -A100000 '^# Code Health' "$REPORT_DIR/ai-run.log" >"$REPORT_DIR/ai-review.md" 2>/dev/null || true
    fi
    if [ -f "$REPORT_DIR/ai-review.md" ] && [ -s "$REPORT_DIR/ai-review.md" ]; then
      warn "AI review extracted from log (output path was not used)"
    else
      fail "AI deep review failed to produce output — see ${REPORT_DIR}/ai-run.log"
    fi
  fi

  fi # end: command -v pi check

  stage_done
fi

# ─── 11. Compile Final Report ────────────────────────────────────────────────

stage "11. Final Report"

REPORT_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

cat >"$REPORT" <<EOFREPORTHEADER
# 🩺 Code Health Report

> **Date:** ${REPORT_DATE}
> **Branch:** $(git branch --show-current 2>/dev/null || echo "unknown")
> **Commit:** $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

## Results Summary

| Metric          | Passed | Failed | Warnings |
|-----------------|--------|--------|----------|
|                 | ${PASS} | ${FAIL} | ${WARN} |

$(if [ "$FAIL" -gt 0 ]; then
  echo "### ⚠️ ${FAIL} failures require attention"
  echo ""
fi)

---

EOFREPORTHEADER

# Append each stage's output in order
for stage_file in "$REPORT_DIR"/*.txt "$REPORT_DIR"/*.md; do
  [ -f "$stage_file" ] || continue
  # Skip files we already structured into the main report
  case "$stage_file" in
  */report.md | */ai-context.md | */ai-review.md) continue ;;
  esac
  cat "$stage_file" >>"$REPORT" 2>/dev/null || true
  echo "" >>"$REPORT"
done

# Append AI review at the end for maximum impact
if [ -f "$REPORT_DIR/ai-review.md" ]; then
  echo "---" >>"$REPORT"
  echo "" >>"$REPORT"
  cat "$REPORT_DIR/ai-review.md" >>"$REPORT"
fi

stage_done

# ─── 12. CI Mode — Post Report ───────────────────────────────────────────────

if [ "$CI_MODE" = true ] || [ "${GITHUB_ACTIONS:-}" = "true" ]; then
  stage "12. CI — Posting Report"

  if command -v gh &>/dev/null && [ -n "${GH_TOKEN:-}" ]; then
    # Ensure required labels exist (idempotent)
    gh label create 'code-health' --description 'Code health audit reports' --color '0075ca' --force 2>/dev/null || true
    gh label create 'auto-generated' --description 'Auto-generated by CI' --color 'e4e669' --force 2>/dev/null || true

    # Try to find existing code-health issue
    HEALTH_ISSUE=$(gh issue list --label code-health --state open --json number --jq '.[0].number' 2>/dev/null || echo "")

    if [ -n "$HEALTH_ISSUE" ]; then
      gh issue comment "$HEALTH_ISSUE" \
        --body "$(head -c 60000 "$REPORT")" \
        2>/dev/null && pass "Posted to existing code-health issue #${HEALTH_ISSUE}" ||
        fail "Failed to comment on issue #${HEALTH_ISSUE}"
    else
      gh issue create \
        --title "🩺 Weekly Code Health Report — $(date +%Y-%m-%d)" \
        --label code-health,auto-generated \
        --body "$(head -c 60000 "$REPORT")" \
        2>/dev/null && pass "Created new code-health issue" ||
        fail "Failed to create GitHub issue"
    fi

    # Also post summary as PR if on a branch
    if [ "${GITHUB_EVENT_NAME:-}" = "schedule" ]; then
      echo "  → Scheduled run — report posted as issue above" >>"$REPORT"
    fi
  else
    warn "gh CLI not available — report written to ${REPORT} only"
  fi

  stage_done
fi

# ─── Done ────────────────────────────────────────────────────────────────────

bold ""
bold "══════════════════════════════════════════════════════════════════"
bold "  Code Health Check Complete"
bold "  Passed: ${PASS}  |  Failed: ${FAIL}  |  Warnings: ${WARN}"
bold "  Full report: ${REPORT}"
bold "══════════════════════════════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
