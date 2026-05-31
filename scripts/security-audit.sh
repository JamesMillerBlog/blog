#!/bin/bash
set -euo pipefail

# =============================================================================
# Weekly Security Audit Script
# =============================================================================
# Runs across: dependencies, secrets, SAST, containers, Terraform, CI/CD.
# Outputs: audit-report.md (human-readable), audit-report.json (machine-readable),
#          audit-warnings.md (non-auto-fixable concerns).
#
# Exit codes:
#   0 — clean
#   1 — auto-fixable issues found (has_fixes=true)
#   2 — warnings only (has_warnings=true)
#   3 — both (has_fixes=true, has_warnings=true)
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORT_MD="$REPO_ROOT/audit-report.md"
REPORT_JSON="$REPO_ROOT/audit-report.json"
WARNINGS_MD="$REPO_ROOT/audit-warnings.md"
TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

FIX_MODE="${FIX_MODE:-true}"
HAS_FIXES=false
HAS_WARNINGS=false

# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------
log_section() {
  echo ""
  echo "━━━ $1 ━━━"
}
log_ok() { echo "  ✅ $1"; }
log_warn() { echo "  ⚠️  $1"; }
log_crit() { echo "  🔴 $1"; }
log_info() { echo "  ℹ️  $1"; }

result_json() {
  # Append a finding to the JSON report
  local tool="$1" severity="$2" title="$3" detail="$4" fixable="$5"
  printf '{"tool":"%s","severity":"%s","title":"%s","detail":"%s","fixable":%s},\n' \
    "$tool" "$severity" "$title" "$detail" "$fixable"
}

# ---------------------------------------------------------------------------
# Init reports
# ---------------------------------------------------------------------------
cat >"$REPORT_MD" <<EOF
# 🔒 Security Audit Report — $TIMESTAMP

| Tool | Critical | High | Medium | Low |
|------|----------|------|--------|-----|
EOF

echo '{"timestamp":"'"$TIMESTAMP"'","findings":[' >"$REPORT_JSON"

cat >"$WARNINGS_MD" <<EOF
## 🔒 Security Audit Warnings — $TIMESTAMP

The following issues were detected but cannot be automatically fixed.
Manual review required.

EOF

WARNING_COUNT=0

add_warning() {
  HAS_WARNINGS=true
  WARNING_COUNT=$((WARNING_COUNT + 1))
  echo "- **$1**: $2" >>"$WARNINGS_MD"
  log_warn "$1: $2"
}

# ---------------------------------------------------------------------------
# 1. Dependency Vulnerability Scan (pnpm audit)
# ---------------------------------------------------------------------------
log_section "1. Dependency Vulnerabilities (pnpm audit)"

cd "$REPO_ROOT/web" || exit 1
AUDIT_JSON=$(mktemp)
trap 'rm -f "$AUDIT_JSON"' EXIT

if pnpm audit --json 2>/dev/null >"$AUDIT_JSON" || true; then
  # Parse audit results
  CRIT=$(jq '[.advisories | to_entries[] | select(.value.severity == "critical")] | length' "$AUDIT_JSON" 2>/dev/null || echo 0)
  HIGH=$(jq '[.advisories | to_entries[] | select(.value.severity == "high")] | length' "$AUDIT_JSON" 2>/dev/null || echo 0)
  MEDIUM=$(jq '[.advisories | to_entries[] | select(.value.severity == "moderate")] | length' "$AUDIT_JSON" 2>/dev/null || echo 0)
  LOW=$(jq '[.advisories | to_entries[] | select(.value.severity == "low")] | length' "$AUDIT_JSON" 2>/dev/null || echo 0)
  TOTAL=$((CRIT + HIGH + MEDIUM + LOW))

  echo "| pnpm audit | $CRIT | $HIGH | $MEDIUM | $LOW |" >>"$REPORT_MD"

  if [ "$TOTAL" -gt 0 ]; then
    log_crit "$TOTAL vulnerabilities found ($CRIT critical, $HIGH high)"

    # List each vulnerability
    jq -r '.advisories | to_entries[] | "  - [\(.value.severity | ascii_upcase)] \(.value.module_name): \(.value.title) (via \(.value.findings[0].paths[0]))"' \
      "$AUDIT_JSON" 2>/dev/null || true

    # Auto-fix if in fix mode
    if [ "$FIX_MODE" = 'true' ]; then
      log_info "Attempting automatic fix..."
      if pnpm audit --fix 2>&1; then
        log_ok "Audit fixes applied"
        HAS_FIXES=true
      else
        log_warn "Some vulnerabilities could not be auto-fixed"
      fi
    fi

    result_json "pnpm-audit" "critical" "Dependency vulnerabilities" \
      "$CRIT critical, $HIGH high, $MEDIUM medium, $LOW low" "$FIX_MODE"
  else
    log_ok "No dependency vulnerabilities"
    echo "| pnpm audit | 0 | 0 | 0 | 0 |" >>"$REPORT_MD"
  fi
else
  log_warn "pnpm audit failed to run"
  echo "| pnpm audit | ❌ | ❌ | ❌ | ❌ |" >>"$REPORT_MD"
fi

# ---------------------------------------------------------------------------
# 2. Secret Scanning (gitleaks — full history)
# ---------------------------------------------------------------------------
log_section "2. Secret Scanning (gitleaks)"

if command -v gitleaks >/dev/null 2>&1; then
  GITLEAKS_OUT=$(mktemp)
  if gitleaks detect --no-banner --redact --source . --report-format=json --report-path="$GITLEAKS_OUT" 2>/dev/null; then
    GITLEAKS_COUNT=0
  else
    GITLEAKS_COUNT=$(jq 'length' "$GITLEAKS_OUT" 2>/dev/null || echo "?")
  fi

  echo "| gitleaks | — | — | $GITLEAKS_COUNT found | — |" >>"$REPORT_MD"

  if [ "$GITLEAKS_COUNT" != '0' ] && [ "$GITLEAKS_COUNT" != '?' ]; then
    log_crit "$GITLEAKS_COUNT potential secrets detected"
    jq -r '.[] | "  - \(.Description): \(.File):\(.StartLine)"' "$GITLEAKS_OUT" 2>/dev/null || true
    add_warning "Secret scan" "$GITLEAKS_COUNT potential secrets found in repository. Verify each is either a false positive or already revoked."
    result_json "gitleaks" "critical" "Potential secrets in repo" \
      "$GITLEAKS_COUNT potential secrets detected" "false"
  else
    log_ok "No secrets detected"
  fi
else
  log_info "gitleaks not installed — skipping"
fi

# ---------------------------------------------------------------------------
# 3. SAST — Code Security Patterns (semgrep)
# ---------------------------------------------------------------------------
log_section "3. SAST — Code Security Patterns (semgrep)"

if command -v semgrep >/dev/null 2>&1; then
  SEMGREP_OUT=$(mktemp)

  # Run security-focused rules against app code
  semgrep scan \
    --config auto \
    --config "p/typescript" \
    --config "p/react" \
    --config "p/dockerfile" \
    --config "p/terraform" \
    --severity ERROR \
    --severity WARNING \
    --json \
    --output "$SEMGREP_OUT" \
    --no-git-ignore \
    web/src/ web/public/ Dockerfile.claude Dockerfile.pi 2>/dev/null || true

  SEMGREP_ERRORS=$(jq '[.results[] | select(.extra.severity == "ERROR")] | length' "$SEMGREP_OUT" 2>/dev/null || echo 0)
  SEMGREP_WARN=$(jq '[.results[] | select(.extra.severity == "WARNING")] | length' "$SEMGREP_OUT" 2>/dev/null || echo 0)

  echo "| semgrep | — | $SEMGREP_ERRORS | $SEMGREP_WARN | — |" >>"$REPORT_MD"

  if [ "$SEMGREP_ERRORS" -gt 0 ]; then
    log_crit "$SEMGREP_ERRORS SAST errors found"
    jq -r '.results[] | select(.extra.severity == "ERROR") | "  - [\(.check_id)] \(.extra.message) — \(.path):\(.start.line)"' \
      "$SEMGREP_OUT" 2>/dev/null || true
    add_warning "SAST errors" "$SEMGREP_ERRORS security issues detected by semgrep. Review manually."
    result_json "semgrep" "high" "SAST findings" \
      "$SEMGREP_ERRORS errors, $SEMGREP_WARN warnings" "false"
  elif [ "$SEMGREP_WARN" -gt 0 ]; then
    log_warn "$SEMGREP_WARN SAST warnings"
  else
    log_ok "No SAST issues"
  fi
else
  log_info "semgrep not installed — skipping"
fi

# ---------------------------------------------------------------------------
# 4. Container Image Scanning (trivy)
# ---------------------------------------------------------------------------
log_section "4. Container Image Scanning (trivy)"

if command -v trivy >/dev/null 2>&1; then
  # Scan Dockerfiles only (can't build images in CI without Docker-in-Docker)
  TRIVY_DOCKERFILE_OUT=$(mktemp)

  trivy config --severity CRITICAL,HIGH --format json \
    --output "$TRIVY_DOCKERFILE_OUT" \
    Dockerfile.claude Dockerfile.pi 2>/dev/null || true

  TRIVY_CRIT=$(jq '[.Results[].Misconfigurations[]? | select(.Severity == "CRITICAL")] | length' "$TRIVY_DOCKERFILE_OUT" 2>/dev/null || echo 0)
  TRIVY_HIGH=$(jq '[.Results[].Misconfigurations[]? | select(.Severity == "HIGH")] | length' "$TRIVY_DOCKERFILE_OUT" 2>/dev/null || echo 0)

  echo "| trivy (Dockerfiles) | $TRIVY_CRIT | $TRIVY_HIGH | — | — |" >>"$REPORT_MD"

  TOTAL_MISCONFIG=$((TRIVY_CRIT + TRIVY_HIGH))
  if [ "$TOTAL_MISCONFIG" -gt 0 ]; then
    log_crit "$TOTAL_MISCONFIG Dockerfile misconfigurations"
    jq -r '.Results[].Misconfigurations[]? | "  - [\(.Severity)] \(.Title) — \(.ID)"' \
      "$TRIVY_DOCKERFILE_OUT" 2>/dev/null || true
    add_warning "Dockerfile config" "$TOTAL_MISCONFIG misconfigurations in Dockerfiles"
    result_json "trivy" "high" "Dockerfile misconfigurations" \
      "$TRIVY_CRIT critical, $TRIVY_HIGH high" "false"
  else
    log_ok "No container misconfigurations"
  fi
else
  log_info "trivy not installed — skipping"
fi

# ---------------------------------------------------------------------------
# 5. Infrastructure as Code (trivy config — replaces deprecated tfsec)
# ---------------------------------------------------------------------------
log_section "5. Infrastructure as Code (trivy config)"

if command -v trivy >/dev/null 2>&1 && [ -d "$REPO_ROOT/infrastructure" ]; then
  TRIVY_IAC_OUT=$(mktemp)
  cd "$REPO_ROOT/infrastructure" || exit 1

  trivy config --severity CRITICAL,HIGH --format json \
    --output "$TRIVY_IAC_OUT" . 2>/dev/null || true

  TRIVY_IAC_CRIT=$(jq '[.Results[].Misconfigurations[]? | select(.Severity == "CRITICAL")] | length' "$TRIVY_IAC_OUT" 2>/dev/null || echo 0)
  TRIVY_IAC_HIGH=$(jq '[.Results[].Misconfigurations[]? | select(.Severity == "HIGH")] | length' "$TRIVY_IAC_OUT" 2>/dev/null || echo 0)

  TOTAL_IAC=$((TRIVY_IAC_CRIT + TRIVY_IAC_HIGH))
  if [ "$TOTAL_IAC" -gt 0 ]; then
    log_crit "$TOTAL_IAC Terraform security issues"
    jq -r '.Results[].Misconfigurations[]? | "  - [\(.Severity)] \(.Title) — \(.ID)"' \
      "$TRIVY_IAC_OUT" 2>/dev/null || true
    echo "| trivy (Terraform) | $TRIVY_IAC_CRIT | $TRIVY_IAC_HIGH | — | — |" >>"$REPORT_MD"
    add_warning "Terraform security" "$TOTAL_IAC issues in Terraform configuration"
    result_json "trivy-iac" "high" "Terraform security issues" \
      "$TRIVY_IAC_CRIT critical, $TRIVY_IAC_HIGH high" "false"
  else
    log_ok "No Terraform security issues"
    echo "| trivy (Terraform) | 0 | 0 | 0 | 0 |" >>"$REPORT_MD"
  fi
else
  log_info "trivy not installed or no infrastructure dir — skipping"
fi

# ---------------------------------------------------------------------------
# 6. GitHub Actions Security (zizmor)
# ---------------------------------------------------------------------------
log_section "6. GitHub Actions Security (zizmor)"

if command -v zizmor >/dev/null 2>&1; then
  ZIZMOR_OUT=$(mktemp)
  cd "$REPO_ROOT" || exit 1

  zizmor --format json .github/workflows/ 2>/dev/null >"$ZIZMOR_OUT" || true

  ZIZMOR_COUNT=$(jq 'length' "$ZIZMOR_OUT" 2>/dev/null || echo 0)

  echo "| zizmor | — | $ZIZMOR_COUNT | — | — |" >>"$REPORT_MD"

  if [ "$ZIZMOR_COUNT" -gt 0 ]; then
    log_crit "$ZIZMOR_COUNT GitHub Actions security issues"
    jq -r '.[] | "  - [\(.determinations.confidence)] \(.determinations.message) — \(.locations[0].file):\(.locations[0].start.line // "?")"' \
      "$ZIZMOR_OUT" 2>/dev/null || true
    add_warning "CI/CD security" "$ZIZMOR_COUNT issues in GitHub Actions workflows"
    result_json "zizmor" "high" "GitHub Actions security" \
      "$ZIZMOR_COUNT issues" "false"
  else
    log_ok "No GitHub Actions issues"
  fi
else
  log_info "zizmor not installed — skipping"
fi

# ---------------------------------------------------------------------------
# 7. License Audit — detect restrictive/copyleft licenses
# ---------------------------------------------------------------------------
log_section "7. License Audit"

cd "$REPO_ROOT/web" || exit 1
LICENSE_OUT=$(mktemp)

# Copyleft / restrictive licenses to flag for a permissive project
RESTRICTIVE_LICENSES='GPL|AGPL|LGPL|CC-BY-SA|EUPL|OSL|Sleepycat|Server Side Public'

if pnpm licenses list --json 2>/dev/null >"$LICENSE_OUT"; then
  FLAGGED=$(jq -r '.[] | select(.license? | test("'$RESTRICTIVE_LICENSES'"; "i")) | "\(.name)@\(.version // "?") — \(.license)"' "$LICENSE_OUT" 2>/dev/null || true)
  FLAG_COUNT=$(echo "$FLAGGED" | grep -c . 2>/dev/null || echo 0)

  echo "| license audit | — | 0 | $FLAG_COUNT flagged | — |" >>"$REPORT_MD"

  if [ "$FLAG_COUNT" -gt 0 ]; then
    log_warn "$FLAG_COUNT packages with restrictive licenses"
    echo "$FLAGGED" | while read -r line; do
      [ -n "$line" ] && log_info "  $line"
    done
    add_warning "License audit" "$FLAG_COUNT packages with copyleft/restrictive licenses. Review for compliance before distribution."
    result_json "license-audit" "medium" "Restrictive licenses found" \
      "$FLAG_COUNT packages" "false"
  else
    log_ok "No restrictive licenses found"
    echo "| license audit | 0 | 0 | 0 | 0 |" >>"$REPORT_MD"
  fi
else
  log_info "pnpm licenses list not supported — skipping"
fi

# ---------------------------------------------------------------------------
# 8. Outdated Dependencies
# ---------------------------------------------------------------------------
log_section "8. Outdated Dependencies"

cd "$REPO_ROOT/web" || exit 1
OUTDATED_OUT=$(mktemp)

if pnpm outdated --no-table --format json 2>/dev/null >"$OUTDATED_OUT" || true; then
  OUTDATED_COUNT=$(jq 'length' "$OUTDATED_OUT" 2>/dev/null || echo 0)

  echo "| outdated deps | — | 0 | $OUTDATED_COUNT | — |" >>"$REPORT_MD"

  if [ "$OUTDATED_COUNT" -gt 0 ] && [ "$OUTDATED_COUNT" != 'null' ]; then
    log_warn "$OUTDATED_COUNT outdated dependencies"
    jq -r 'to_entries[] | "  - \(.key): \(.value.current // "?") → \(.value.latest // "?")"' \
      "$OUTDATED_OUT" 2>/dev/null || true

    # Auto-update in fix mode (patch/minor only by default)
    if [ "$FIX_MODE" = 'true' ] && [ "$OUTDATED_COUNT" -gt 0 ]; then
      log_info "Updating patch/minor versions..."
      if pnpm update 2>&1; then
        log_ok "Dependencies updated"
        HAS_FIXES=true
      fi
    fi

    result_json "outdated-deps" "low" "Outdated dependencies" \
      "$OUTDATED_COUNT packages outdated" "$FIX_MODE"
  elif [ "$OUTDATED_COUNT" = '0' ] || [ "$OUTDATED_COUNT" = 'null' ]; then
    log_ok "All dependencies up to date"
  fi
else
  log_info "pnpm outdated failed — skipping"
fi

# ---------------------------------------------------------------------------
# 9. Build Output Secret Scan
# ---------------------------------------------------------------------------
log_section "9. Build Output Secret Scan"

cd "$REPO_ROOT/web" || exit 1

# Scan built output for leaked environment variable values or secrets
if [ -d out ]; then
  # Patterns: env vars commonly leaked into client bundles
  LEAKED_COUNT=0
  for pattern in 'NEXT_PUBLIC_[A-Z_]+' 'API_KEY|SECRET|TOKEN|PASSWORD|PRIVATE' \
    'ghp_[a-zA-Z0-9]{36}' 'sk-[a-zA-Z0-9]{32,}'; do
    FOUND=$(grep -rPo "$pattern" out/ 2>/dev/null | grep -v 'NEXT_PUBLIC_ENVIRONMENT' | head -5 || true)
    if [ -n "$FOUND" ]; then
      LEAKED_COUNT=$((LEAKED_COUNT + 1))
      echo "$FOUND" | while read -r line; do
        log_warn "Potential leak in build: ${line:0:120}"
      done
    fi
  done

  echo "| build secret scan | 0 | $LEAKED_COUNT | 0 | 0 |" >>"$REPORT_MD"

  if [ "$LEAKED_COUNT" -gt 0 ]; then
    add_warning "Build output leak" \
      "$LEAKED_COUNT potential secrets or env vars found in build output. These are shipped to the client."
    result_json "build-secret-scan" "high" "Secrets in build output" \
      "$LEAKED_COUNT potential leaks" "false"
  else
    log_ok "No secrets leaked in build output"
  fi
else
  log_info "No build output directory — skipping"
fi

# ---------------------------------------------------------------------------
# 10. Deployed Site Probe — exposed files & security headers
# ---------------------------------------------------------------------------
log_section "10. Deployed Site Probe"

SITE_URL="${SECURITY_AUDIT_SITE_URL:-https://jamesmiller.blog}"
# 10a. Check for commonly exposed sensitive paths
EXPOSED_PATHS=(
  "/.git/HEAD"
  "/.env"
  "/.envrc"
  "/.env.local"
  "/wp-admin"
  "/wp-login.php"
  "/backup"
  "/.DS_Store"
  "/config.toml"
  "/package.json"
  "/.gitignore"
)

EXPOSED_COUNT=0
for path in "${EXPOSED_PATHS[@]}"; do
  STATUS=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$SITE_URL$path" 2>/dev/null || echo '000')
  if [ "$STATUS" = '200' ] || [ "$STATUS" = '301' ]; then
    EXPOSED_COUNT=$((EXPOSED_COUNT + 1))
    log_crit "Exposed: $SITE_URL$path → HTTP $STATUS"
    add_warning "Exposed path" "$SITE_URL$path returned HTTP $STATUS. Should not be publicly accessible."
  fi
done

# 10b. Check security headers
HEADERS=$(curl -sI --max-time 5 "$SITE_URL" 2>/dev/null || true)

check_header() {
  local header="$1" description="$2"
  if ! echo "$HEADERS" | grep -qi "^$header:"; then
    add_warning "Missing security header" "$header ($description) not set on $SITE_URL"
    log_warn "Missing header: $header ($description)"
  fi
}

check_header "Content-Security-Policy" "prevents XSS/MIME sniffing"
check_header "X-Content-Type-Options" "prevents MIME sniffing"
check_header "X-Frame-Options" "prevents clickjacking"
check_header "Strict-Transport-Security" "enforces HTTPS"
check_header "Referrer-Policy" "controls referrer leakage"
check_header "Permissions-Policy" "restricts browser features"

echo "| site probe | 0 | $EXPOSED_COUNT exposed | — | — |" >>"$REPORT_MD"

if [ "$EXPOSED_COUNT" -eq 0 ]; then
  log_ok "No sensitive files exposed on $SITE_URL"
fi

# 10c. Check TLS version
TLS_PROBE=$(curl -s --max-time 5 -o /dev/null -w '%{ssl_verify_result}\n%{http_version}' "$SITE_URL" 2>/dev/null || true)
if echo "$TLS_PROBE" | head -1 | grep -q '^0$'; then
  log_ok "TLS certificate valid"
else
  log_warn "TLS certificate issue on $SITE_URL"
  add_warning "TLS certificate" "TLS verification failed for $SITE_URL"
fi

result_json "site-probe" "high" "Deployed site security" \
  "$EXPOSED_COUNT exposed paths, headers checked" "false"

# ---------------------------------------------------------------------------
# 11. Manual Checks — AI Pipeline Security
# ---------------------------------------------------------------------------
log_section "11. Manual Checks — AI Pipeline & CI/CD"

# 7a. Check that AI workflows are restricted to repo owner
cd "$REPO_ROOT" || exit 1
for wf in .github/workflows/ai-*.yml; do
  if [ -f "$wf" ]; then
    if ! grep -q "github.event.sender.login == github.repository_owner" "$wf" 2>/dev/null; then
      add_warning "AI workflow missing owner guard" \
        "$wf does not check 'github.event.sender.login == github.repository_owner'. External users could trigger AI actions."
    fi
  fi
done
log_ok "AI pipeline owner guard check complete"

# 11b. Check Docker images run as non-root
for df in Dockerfile.claude Dockerfile.pi; do
  if [ -f "$df" ] && ! grep -q '^USER ' "$df" 2>/dev/null; then
    add_warning "Dockerfile missing USER" \
      "$df does not specify a non-root USER. Container may run as root."
  fi
done
log_ok "Docker non-root check complete"

# 11c. Check for hardcoded tokens in workflow files
for wf in .github/workflows/*.yml; do
  if grep -qP 'ghp_|gho_|ghu_|ghs_|ghr_' "$wf" 2>/dev/null; then
    add_warning "Potential token in workflow" \
      "$wf contains patterns matching GitHub tokens. Verify these are not real secrets."
  fi
done
log_ok "Workflow token scan complete"

# 11d. Check action pinning (SHA vs tag)
UNPINNED=$(grep -r "uses:" .github/workflows/ | grep -oP 'uses:\s*\S+@v\d' | sort -u || true)
if [ -n "$UNPINNED" ]; then
  add_warning "Unpinned GitHub Actions" \
    "Some actions use version tags instead of commit SHAs: $(echo "$UNPINNED" | tr '\n' ' '). Pin to commit SHA for supply chain integrity."
else
  log_ok "All GitHub Actions pinned to commit SHAs"
fi

# ---------------------------------------------------------------------------
# 12. Build Verification
# ---------------------------------------------------------------------------
log_section "12. Build Verification"

cd "$REPO_ROOT/web" || exit 1
if pnpm build 2>&1 | tail -5; then
  log_ok "Build successful"
else
  log_crit "Build failed — fix PR would be broken"
  add_warning "Build failure" "The project failed to build. Audit fix PRs may not pass CI."
fi

# ---------------------------------------------------------------------------
# Finalize reports
# ---------------------------------------------------------------------------
# Close JSON array
sed -i '$ s/,$//' "$REPORT_JSON" 2>/dev/null || true
echo ']}' >>"$REPORT_JSON"

# Add summary to markdown report
{
  echo ""
  echo "---"
  echo ""
  echo "## Summary"
  echo ""
  if [ "$HAS_FIXES" = true ]; then
    echo "- ✅ **Auto-fixable changes**: committed to fix branch"
  fi
  if [ "$HAS_WARNINGS" = true ]; then
    echo "- ⚠️  **Warnings requiring review**: $WARNING_COUNT issue(s) — see audit-warnings.md"
  fi
  if [ "$HAS_FIXES" = false ] && [ "$HAS_WARNINGS" = false ]; then
    echo "- ✅ **No issues found**"
  fi
  echo ""
  echo "**Scan timestamp**: $TIMESTAMP"
} >>"$REPORT_MD"

# Output step results for CI
if [ "$HAS_FIXES" = true ]; then
  echo "has_fixes=true" >>"$GITHUB_OUTPUT"
fi
if [ "$HAS_WARNINGS" = true ]; then
  echo "has_warnings=true" >>"$GITHUB_OUTPUT"
fi

# Final status
echo ""
echo "══════════════════════════════════════════════"
if [ "$HAS_FIXES" = true ] && [ "$HAS_WARNINGS" = true ]; then
  echo "  Audit: FIXES + WARNINGS found"
  exit 3
elif [ "$HAS_FIXES" = true ]; then
  echo "  Audit: FIXABLE issues found"
  exit 1
elif [ "$HAS_WARNINGS" = true ]; then
  echo "  Audit: WARNINGS only"
  exit 2
else
  echo "  Audit: CLEAN — no issues found"
  exit 0
fi
