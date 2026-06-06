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

# GREP_P — grep binary with PCRE (-P) support.
# Set to 'ggrep' by security-audit-run.sh on macOS; falls back to 'grep' on Linux/CI.
GREP_P="${GREP_P:-grep}"
HAVE_PCRE=false
"$GREP_P" -qP '' /dev/null 2>/dev/null && HAVE_PCRE=true

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

    # Auto-fix if in fix mode — snapshot package.json first to detect major bumps
    if [ "$FIX_MODE" = 'true' ]; then
      log_info "Attempting automatic fix..."
      # Snapshot both web/package.json and root package.json — pnpm --fix writes overrides to root
      PKG_BEFORE=$(md5sum package.json "$REPO_ROOT/package.json" 2>/dev/null || \
                   shasum package.json "$REPO_ROOT/package.json" 2>/dev/null || echo '')

      if pnpm audit --fix 2>&1; then
        PKG_AFTER=$(md5sum package.json "$REPO_ROOT/package.json" 2>/dev/null || \
                    shasum package.json "$REPO_ROOT/package.json" 2>/dev/null || echo '')

        if [ "$PKG_BEFORE" != "$PKG_AFTER" ]; then
          # If root package.json changed, pnpm --fix wrote pnpm.overrides entries.
          # Overrides apply workspace-wide and can silently force major version bumps
          # (e.g. vitest@<4.1.0 → >=4.1.0 breaks vite peer deps). Always revert and warn.
          ROOT_AFTER_HASH=$(md5sum "$REPO_ROOT/package.json" 2>/dev/null | awk '{print $1}' || \
                            shasum "$REPO_ROOT/package.json" 2>/dev/null | awk '{print $1}' || echo '')
          ROOT_BEFORE_HASH=$(echo "$PKG_BEFORE" | grep -F "$REPO_ROOT/package.json" | awk '{print $1}' || echo '')

          if [ "$ROOT_BEFORE_HASH" != "$ROOT_AFTER_HASH" ]; then
            OVERRIDES_ADDED=$(git -C "$REPO_ROOT" diff package.json 2>/dev/null | grep '^+.*"[^"]*@' | grep -v '^+++' || true)
            log_warn "pnpm audit --fix wrote root pnpm.overrides — REVERTING (overrides are workspace-global and may force major bumps):"
            echo "$OVERRIDES_ADDED" | while IFS= read -r line; do log_warn "  $line"; done
            git -C "$REPO_ROOT" checkout package.json 2>/dev/null || true
            add_warning "CVE fix requires pnpm.overrides" \
              "pnpm audit --fix wanted to add root overrides. Apply manually after reviewing: $OVERRIDES_ADDED"
          fi

          # Detect major version bumps in web/package.json
          MAJOR_FIXED=$(git diff package.json 2>/dev/null | \
            grep '^[+-].*"[0-9]\+\.' | \
            awk -F'"' '{print $2, $4}' | \
            awk 'NR%2==1{prev=$0} NR%2==0{
              split(prev,a," "); split($0,b," ");
              n=split(a[2],va,"."); m=split(b[2],vb,".");
              gsub(/[^0-9]/,"",va[1]); gsub(/[^0-9]/,"",vb[1]);
              if(vb[1]+0 > va[1]+0) print a[1], a[2], "->", b[2]
            }' 2>/dev/null || true)

          if [ -n "$MAJOR_FIXED" ]; then
            log_warn "pnpm audit --fix bumped major versions in web/package.json — REVERTING:"
            echo "$MAJOR_FIXED" | while IFS= read -r line; do log_warn "  $line"; done
            git checkout package.json 2>/dev/null || true
            add_warning "CVE fix requires major version bump" \
              "pnpm audit --fix wanted to bump major versions: $MAJOR_FIXED. Apply manually after reviewing breaking changes."
          else
            log_ok "Audit fixes applied (no major bumps)"
            HAS_FIXES=true
          fi
        else
          log_ok "Audit fixes applied"
          HAS_FIXES=true
        fi
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
  FLAG_COUNT=0
  [ -n "$FLAGGED" ] && FLAG_COUNT=$(printf '%s\n' "$FLAGGED" | wc -l | tr -d ' ')

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

AGE_GATE_DAYS=14  # Skip updates where the available version is newer than this many days

if pnpm outdated --no-table --format json 2>/dev/null >"$OUTDATED_OUT" || true; then
  OUTDATED_COUNT=$(jq 'length' "$OUTDATED_OUT" 2>/dev/null || echo 0)

  echo "| outdated deps | — | 0 | $OUTDATED_COUNT | — |" >>"$REPORT_MD"

  if [ "$OUTDATED_COUNT" -gt 0 ] && [ "$OUTDATED_COUNT" != 'null' ]; then
    log_warn "$OUTDATED_COUNT outdated dependencies"

    MAJOR_BUMPS=''
    TOO_NEW=''
    SAFE_TO_UPDATE=''

    # Classify each outdated package
    while IFS= read -r pkg; do
      current=$(jq -r --arg p "$pkg" '.[$p].current // "0.0.0"' "$OUTDATED_OUT" 2>/dev/null)
      latest=$(jq -r --arg p "$pkg" '.[$p].latest // "0.0.0"' "$OUTDATED_OUT" 2>/dev/null)

      current_major=$(echo "$current" | cut -d. -f1 | tr -d '^~')
      latest_major=$(echo "$latest" | cut -d. -f1 | tr -d '^~')

      log_info "  $pkg: ${current} -> ${latest}"

      # Check for major version bump
      if [ "$latest_major" -gt "$current_major" ] 2>/dev/null; then
        MAJOR_BUMPS="$MAJOR_BUMPS $pkg(${current}->${latest})"
        log_warn "  Major bump skipped: $pkg ${current} -> ${latest} (manual review required)"
        continue
      fi

      # Check publish age via npm registry
      PUBLISH_DATE=$(npm view "$pkg@$latest" time --json 2>/dev/null | \
        jq -r --arg v "$latest" '.[$v] // empty' 2>/dev/null || echo '')

      if [ -n "$PUBLISH_DATE" ]; then
        PUBLISH_TS=$(date -d "$PUBLISH_DATE" +%s 2>/dev/null || \
                     date -j -f '%Y-%m-%dT%H:%M:%S' "${PUBLISH_DATE%%.*}" +%s 2>/dev/null || echo 0)
        NOW_TS=$(date +%s)
        AGE_DAYS=$(( (NOW_TS - PUBLISH_TS) / 86400 ))

        if [ "$AGE_DAYS" -lt "$AGE_GATE_DAYS" ]; then
          TOO_NEW="$TOO_NEW $pkg@$latest(${AGE_DAYS}d old)"
          log_warn "  Age-gated: $pkg@$latest published ${AGE_DAYS} days ago — skipping (< ${AGE_GATE_DAYS}d)"
          continue
        fi
      fi

      SAFE_TO_UPDATE="$SAFE_TO_UPDATE $pkg"
    done < <(jq -r 'keys[]' "$OUTDATED_OUT" 2>/dev/null)

    # Report major bumps needing manual review
    if [ -n "$MAJOR_BUMPS" ]; then
      add_warning "Major version bumps available" \
        "The following packages have major updates available — review breaking changes before updating:$(echo "$MAJOR_BUMPS" | tr ' ' '\n' | grep -v '^$' | sed 's/^/  /')"
      result_json "outdated-deps" "medium" "Major version bumps available" \
        "$(echo "$MAJOR_BUMPS" | tr ' ' '\n' | grep -c .) packages" "false"
    fi

    # Report age-gated packages
    if [ -n "$TOO_NEW" ]; then
      add_warning "Recently published versions skipped" \
        "The following packages have updates published < ${AGE_GATE_DAYS} days ago (supply chain risk window):$(echo "$TOO_NEW" | tr ' ' '\n' | grep -v '^$' | sed 's/^/  /')"
    fi

    # Auto-update safe packages in fix mode
    if [ "$FIX_MODE" = 'true' ] && [ -n "$SAFE_TO_UPDATE" ]; then
      SAFE_COUNT=$(echo "$SAFE_TO_UPDATE" | tr ' ' '\n' | grep -c . || echo 0)
      log_info "Updating $SAFE_COUNT safe patch/minor packages..."
      if pnpm update 2>&1; then
        log_ok "Dependencies updated"
        HAS_FIXES=true
      fi
    elif [ "$FIX_MODE" = 'false' ] && [ -n "$SAFE_TO_UPDATE" ]; then
      log_info "Safe updates available (run with FIX_MODE=true to apply): $SAFE_TO_UPDATE"
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

# 11a. Check that AI workflows are restricted to repo owner or safe trigger types
# Valid authorization patterns (any one is sufficient):
#   1. sender/comment/PR-review-comment user == repository_owner
#   2. Same-repo PR guard (fork PRs excluded)
#   3. schedule: only trigger (no user-controlled event source)
#   4. repository_dispatch (requires API token with repo scope)
#   5. Shell-level actor verification (ACTOR == "$OWNER" pattern)
cd "$REPO_ROOT" || exit 1
for wf in .github/workflows/ai-*.yml; do
  if [ -f "$wf" ]; then
    GUARDED=false
    # Pattern 1: owner comparison in job/step if condition
    grep -q 'repository_owner' "$wf" 2>/dev/null && GUARDED=true
    # Pattern 2: same-repo PR guard
    grep -q 'head\.repo\.full_name == github\.repository' "$wf" 2>/dev/null && GUARDED=true
    # Pattern 3: schedule-only or schedule+workflow_dispatch (workflow_dispatch requires write access)
    # Count interactive trigger types present (excluding schedule)
    # Trigger keys end the line bare (e.g. "  issues:"); permission lines have a value (e.g. "  issues: write")
    # If no untrusted-user-triggerable event types present, only schedule/workflow_dispatch remain
    # (workflow_dispatch requires write access; schedule is GitHub-controlled)
    if ! grep -qE '^\s+(push|pull_request|issues|issue_comment|pull_request_review_comment):[[:space:]]*$' "$wf" 2>/dev/null; then
      GUARDED=true
    fi
    # Pattern 4: repository_dispatch (API-token gated)
    grep -q 'repository_dispatch' "$wf" 2>/dev/null && GUARDED=true
    # Pattern 5: shell-level actor check
    grep -q 'ACTOR.*OWNER\|OWNER.*ACTOR' "$wf" 2>/dev/null && GUARDED=true
    # Pattern 6: PR merged + branch prefix (merging requires write access)
    if grep -q 'pull_request.merged == true' "$wf" 2>/dev/null || \
       grep -q "startsWith(github.event.pull_request.head.ref" "$wf" 2>/dev/null; then
      GUARDED=true
    fi

    if [ "$GUARDED" = 'false' ]; then
      add_warning "AI workflow missing owner guard" \
        "$wf has no recognized owner/auth guard. Verify external users cannot trigger AI actions."
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
UNPINNED=$(grep -r "uses:" .github/workflows/ | grep -oE 'uses:[[:space:]]*[^[:space:]]+@v[0-9][^0-9 ]*' | sort -u || true)
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

log_info "Skipping — build verification requires content (POSTS_BUCKET or _posts/). Use regular CI for build checks."

# ---------------------------------------------------------------------------
# 13. Markdown Audit — Sensitive Disclosures (AI-generated & general)
# ---------------------------------------------------------------------------
log_section "13. Markdown Audit — Sensitive Disclosures"

cd "$REPO_ROOT" || exit 1
MD_ISSUES=0

if [ "$HAVE_PCRE" = 'false' ]; then
  log_info "Skipping — grep -P (PCRE) not available. Install GNU grep to enable: brew install grep"
  echo "| markdown audit | — | — | skipped | — |" >>"$REPORT_MD"
else

# Scan all .md files, excluding vendored dirs, and report matches.
# $1 = human label  $2 = perl regex  $3 = optional grep -v exclusion pattern
md_check() {
  local label="$1" pattern="$2" exclude="${3:-}"
  local results
  results=$("$GREP_P" -rPn "$pattern" \
    --include='*.md' \
    --exclude-dir=node_modules \
    --exclude-dir=.git \
    . 2>/dev/null || true)
  if [ -n "$exclude" ]; then
    results=$(echo "$results" | grep -v "$exclude" || true)
  fi
  if [ -n "$results" ]; then
    MD_ISSUES=$((MD_ISSUES + 1))
    echo "$results" | while IFS= read -r hit; do
      log_warn "$label: ${hit:0:200}"
    done
    add_warning "Markdown disclosure: $label" \
      "Matches above may expose sensitive details to public repo readers. Verify each is intentional."
    result_json "md-audit" "medium" "Markdown: $label" \
      "See audit-warnings.md for file:line matches" "false"
  fi
}

# 1. AWS account IDs — 12-digit numbers standing alone
md_check 'AWS account ID' '\b[0-9]{12}\b'

# 2. AWS ARNs — any arn:aws: reference (often includes account ID + region)
md_check 'AWS ARN' 'arn:aws:[a-z0-9\-]+:[a-z0-9\-]*:[0-9]*'

# 3. Cloudflare account / zone IDs — 32-char lowercase hex
md_check 'Cloudflare account/zone ID' '(?<![a-f0-9])[0-9a-f]{32}(?![a-f0-9])'

# 4. Private / RFC-1918 IP addresses
md_check 'Internal IP address' \
  '\b(10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|192\.168\.[0-9]{1,3}\.[0-9]{1,3}|172\.(1[6-9]|2[0-9]|3[01])\.[0-9]{1,3}\.[0-9]{1,3})\b'

# 5. Cloud storage bucket/container URIs
md_check 'Cloud storage URI' '(s3|r2|gs|azblob)://[a-z0-9][a-z0-9\-\.]{2,61}'

# 6. Specific bucket names matching project naming patterns
#    Catches docs describing "jamesmiller-blog-pr-{n}" etc. without needing URI prefix
md_check 'Project bucket name pattern' \
  '[a-z0-9\-]+-(?:pr-[0-9]+|staging|production|ephemeral)\b' \
  'example\|placeholder\|your-bucket\|<'

# 7. Ephemeral / staging subdomain patterns — reveals enumerable attack surface
md_check 'Enumerable staging subdomain' 'pr-[0-9]+\.[a-z0-9\-]+\.[a-z]{2,}'

# 8. GitHub PATs / OAuth tokens accidentally pasted into docs
md_check 'GitHub token' 'gh[pousr]_[A-Za-z0-9]{20,}'

# 9. Hardcoded credential values in examples
#    Excludes placeholder text so legit docs aren't over-flagged
md_check 'Hardcoded credential' \
  '(?i)(password|passwd|secret|token|api[_\-]?key)\s*[:=]\s*["'"'"']?[A-Za-z0-9!@#$%^&*()\-_+]{10,}["'"'"']?' \
  'example\|placeholder\|changeme\|your-\|<your\|TODO\|\${\|CHANGE_ME\|variable\|secret_name'

# 10. Personal email addresses (non-public contact addresses)
#     The public blog address (hi@jamesmiller.blog) is already published — skip it
md_check 'Personal email address' \
  '[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}' \
  'example\.com\|noreply\|@users\.noreply\.github\|hi@jamesmiller\.blog\|@dependabot'

# 11. AWS region literals — reveals infrastructure geography to an attacker
md_check 'AWS region literal' \
  '\b(us|eu|ap|sa|ca|me|af)-(east|west|north|south|central|northeast|southeast|northwest)-[1-4]\b' \
  'example\|placeholder\|your-region'

# 12. Staging Basic Auth mechanics — how to bypass or what credential var names are
md_check 'Auth mechanism detail' \
  '(?i)(basic.?auth.?(username|password|bypass|credential)|auth\.js.*bypass|how.to.bypass)'

# 13. Terraform state backend details — bucket + key combos used for remote state
md_check 'Terraform state backend detail' \
  '(?i)(terraform.*backend|backend.*bucket|tfstate.*bucket|bucket.*tfstate)'

# 14. CI/CD secret variable names in detail — enumerates what secrets exist
#     Flag lines that list multiple secret names together (suggests a secrets inventory)
md_check 'Secrets inventory' \
  '(?i)(CLOUDFLARE_API_TOKEN|TF_VAR_|BASIC_AUTH_PASSWORD|WRANGLER_).*(?:secret|env|variable)'

# 15. Cron schedule disclosure — reveals detection windows and maintenance timing
#     An attacker knowing your scan schedule knows your gap window
md_check 'Cron schedule' \
  'cron:\s*["\x27]?[0-9\*\/\-,]+ [0-9\*\/\-,]+ [0-9\*\/\-,]+ [0-9\*\/\-,]+ [0-9\*\/\-,]'

# 16. Pinned tool versions in docs — maps to known bypass techniques or CVEs
#     e.g. "trivy 0.70.0" lets attacker check that version for false-negative bypasses
md_check 'Pinned tool version' \
  '(?i)(semgrep|trivy|gitleaks|zizmor|snyk|checkov|tfsec|bandit|gosec)\s+(v?[0-9]+\.[0-9]+\.[0-9]+)'

echo "| markdown audit | — | — | $MD_ISSUES | — |" >>"$REPORT_MD"

if [ "$MD_ISSUES" -eq 0 ]; then
  log_ok "No sensitive disclosures detected in markdown files"
else
  log_warn "$MD_ISSUES markdown disclosure category/categories flagged — review audit-warnings.md"
fi
fi  # end HAVE_PCRE guard

# ---------------------------------------------------------------------------
# 14. Source Code Checks — Runtime Data Leakage & Dangerous Patterns
# ---------------------------------------------------------------------------
log_section "14. Source Code — Leakage & Dangerous Patterns"

cd "$REPO_ROOT" || exit 1
SRC_ISSUES=0

if [ "$HAVE_PCRE" = 'false' ]; then
  log_info "Skipping — grep -P (PCRE) not available. Install GNU grep to enable: brew install grep"
  echo "| source audit | — | skipped | — | — |" >>"$REPORT_MD"
else

src_check() {
  local label="$1" pattern="$2" path="$3" exclude="${4:-}"
  local results
  results=$("$GREP_P" -rPn "$pattern" \
    --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' \
    --exclude-dir=node_modules \
    --exclude-dir=.git \
    --exclude-dir='*.test.*' \
    --exclude='*.test.ts' \
    --exclude='*.test.tsx' \
    --exclude='*.spec.ts' \
    --exclude='*.spec.tsx' \
    "$path" 2>/dev/null || true)
  if [ -n "$exclude" ]; then
    results=$(echo "$results" | grep -v "$exclude" || true)
  fi
  if [ -n "$results" ]; then
    SRC_ISSUES=$((SRC_ISSUES + 1))
    local count
    count=$(echo "$results" | wc -l | tr -d ' ')
    echo "$results" | head -10 | while IFS= read -r hit; do
      log_warn "$label: ${hit:0:200}"
    done
    [ "$count" -gt 10 ] && log_info "  ... and $((count - 10)) more matches"
    add_warning "Source: $label" \
      "$count match(es) in production source. Review each for unintended data exposure."
    result_json "src-audit" "medium" "Source: $label" \
      "$count occurrences" "false"
  fi
}

# console.log in production source — ships data to every visitor's browser devtools
src_check 'console.log in production source' \
  'console\.(log|debug|dir|table)\(' \
  "$REPO_ROOT/web/src" \
  '__tests__\|\.test\.\|\.spec\.\|// eslint-disable'

# dangerouslySetInnerHTML — bypasses React's XSS protection
src_check 'dangerouslySetInnerHTML' \
  'dangerouslySetInnerHTML' \
  "$REPO_ROOT/web/src"

# Detect eval() / new Function() in scanned source — this is a grep pattern, not an eval call
src_check 'Dynamic code execution (eval/Function)' \
  '\beval\s*\(|\bnew\s+Function\s*\(' \
  "$REPO_ROOT/web/src" \
  '//.*eval\|/\*.*eval'

# Hardcoded localhost / 127.0.0.1 in production source — leaks internal service topology
# and may cause silent failures if shipped to production
src_check 'Hardcoded localhost/dev URL' \
  'https?://(localhost|127\.0\.0\.1)(:[0-9]+)?' \
  "$REPO_ROOT/web/src" \
  '\.test\.\|\.spec\.\|__tests__\|// '

# document.write — legacy DOM injection, XSS risk
src_check 'document.write' \
  '\bdocument\.write\s*\(' \
  "$REPO_ROOT/web/src"

# innerHTML assignment (not via React) — raw DOM XSS vector
src_check 'innerHTML assignment' \
  '\.innerHTML\s*=' \
  "$REPO_ROOT/web/src" \
  'dangerouslySetInnerHTML\|//.*innerHTML'

echo "| source audit | — | $SRC_ISSUES | — | — |" >>"$REPORT_MD"

if [ "$SRC_ISSUES" -eq 0 ]; then
  log_ok "No dangerous patterns detected in production source"
else
  log_warn "$SRC_ISSUES source code category/categories flagged — review audit-warnings.md"
fi
fi  # end HAVE_PCRE guard

# ---------------------------------------------------------------------------
# 15. AI Prompt Security Boundary Scan
# ---------------------------------------------------------------------------
log_section "15. AI Prompt Security Boundary Scan"

cd "$REPO_ROOT" || exit 1
PROMPT_ISSUES=0

if [ "$HAVE_PCRE" = 'false' ]; then
  log_info "Skipping — grep -P (PCRE) not available. Install GNU grep to enable: brew install grep"
  echo "| prompt audit | — | — | skipped | — |" >>"$REPORT_MD"
else

# Collect all committed AI prompt/agent files
PROMPT_FILES=$(find . \
  \( -path './.pi/prompts/*.md' \
     -o -path './.claude/agents/*.md' \
     -o -path './.agents/skills/*.md' \
     -o -path './.pi/agents/*.md' \
  \) \
  -not -path '*/node_modules/*' \
  -not -path '*/.git/*' \
  2>/dev/null || true)

if [ -z "$PROMPT_FILES" ]; then
  log_info "No AI prompt/agent files found — skipping"
else
  PROMPT_FILE_COUNT=$(echo "$PROMPT_FILES" | wc -l | tr -d ' ')
  log_info "Scanning $PROMPT_FILE_COUNT AI prompt/agent files"

  # Extract and report every explicit security boundary instruction.
  # These lines describe what the AI is prohibited from doing — publicly listing
  # them tells an attacker exactly where the guardrails are and what to probe.
  BOUNDARY_LINES=$(echo "$PROMPT_FILES" | xargs "$GREP_P" -Pn \
    '(?i)(do not|never|must not|prohibited|forbidden|do NOT|NEVER|ignore.*instruction|disregard|bypass|override.*instruction)' \
    2>/dev/null || true)

  if [ -n "$BOUNDARY_LINES" ]; then
    PROMPT_ISSUES=$((PROMPT_ISSUES + 1))
    BOUNDARY_COUNT=$(echo "$BOUNDARY_LINES" | wc -l | tr -d ' ')
    log_warn "$BOUNDARY_COUNT security boundary instruction(s) in public AI prompts:"
    echo "$BOUNDARY_LINES" | while IFS= read -r hit; do
      log_info "  ${hit:0:200}"
    done
    add_warning "AI prompt boundaries public" \
      "$BOUNDARY_COUNT 'do not / never / prohibited' instructions are committed in public prompt files. \
These tell an attacker exactly what the AI has been told to refuse — making targeted prompt injection easier. \
Consider moving sensitive boundary instructions to private environment variables or runtime configuration."
    result_json "prompt-audit" "medium" "AI security boundaries public" \
      "$BOUNDARY_COUNT boundary instructions exposed in committed prompts" "false"
  else
    log_ok "No explicit security boundary instructions found in prompt files"
  fi

  # Also flag prompts that describe auto-commit / auto-push behaviour — these are
  # high-value prompt injection targets since a successful injection could write
  # malicious code that gets committed automatically.
  AUTOCOMMIT_LINES=$(echo "$PROMPT_FILES" | xargs "$GREP_P" -Pn \
    '(?i)(git (add|commit|push)|auto.?commit|auto.?push|commit.*automatically|push.*automatically)' \
    2>/dev/null || true)

  if [ -n "$AUTOCOMMIT_LINES" ]; then
    PROMPT_ISSUES=$((PROMPT_ISSUES + 1))
    AUTOCOMMIT_COUNT=$(echo "$AUTOCOMMIT_LINES" | wc -l | tr -d ' ')
    log_warn "$AUTOCOMMIT_COUNT auto-commit/push instruction(s) in public AI prompts:"
    echo "$AUTOCOMMIT_LINES" | while IFS= read -r hit; do
      log_info "  ${hit:0:200}"
    done
    add_warning "AI auto-commit instructions public" \
      "$AUTOCOMMIT_COUNT references to automatic git commit/push in public prompts. \
An attacker crafting a malicious issue or PR comment could trigger code that gets committed \
and deployed automatically. Ensure all AI pipeline triggers are restricted to the repo owner."
    result_json "prompt-audit" "medium" "AI auto-commit behaviour public" \
      "$AUTOCOMMIT_COUNT auto-commit/push instructions exposed" "false"
  else
    log_ok "No auto-commit/push instructions found in prompt files"
  fi
fi
fi  # end HAVE_PCRE guard

echo "| prompt audit | — | — | $PROMPT_ISSUES | — |" >>"$REPORT_MD"

# ---------------------------------------------------------------------------
# 16. Git Commit Message Intelligence
# ---------------------------------------------------------------------------
log_section "16. Git Commit History — Security Signals"

cd "$REPO_ROOT" || exit 1
GIT_ISSUES=0

# Scan full commit history for messages that reveal past security incidents.
# These signal recurring vulnerability classes, previously leaked secrets,
# or patches that an attacker knows to look for regressions of.
SECURITY_COMMITS=$(git log --all --oneline 2>/dev/null | \
  grep -iE \
    'secret|token|credential|password|api.?key|remove.*key|key.*remove|\
CVE|XSS|inject|sqli|rce|csrf|ssrf|traversal|overflow|bypass|\
revert.*accidental|accidental.*revert|oops|undo.*commit|exposed|leaked|\
hardcode|hard.code|plaintext|plain.text|rotation|rotate.*key|revoke' \
  2>/dev/null || true)

if [ -n "$SECURITY_COMMITS" ]; then
  GIT_ISSUES=$((GIT_ISSUES + 1))
  COMMIT_COUNT=$(echo "$SECURITY_COMMITS" | wc -l | tr -d ' ')
  log_warn "$COMMIT_COUNT commit message(s) reference past security events:"
  echo "$SECURITY_COMMITS" | while IFS= read -r line; do
    log_info "  $line"
  done
  add_warning "Commit history security signals" \
    "$COMMIT_COUNT commits in public history reference secrets, CVEs, or security fixes. \
These map historical vulnerability classes for an attacker — review each to confirm the \
underlying issue is fully resolved and no sensitive data remains reachable in history."
  result_json "git-history" "medium" "Security-relevant commit messages" \
    "$COMMIT_COUNT commits flagged" "false"
else
  log_ok "No security-significant commit messages found in history"
fi

# Also check for any commits that added then removed files matching secret patterns —
# the content is still in history even if the file is gone from HEAD
GHOST_FILES=$(git log --all --diff-filter=D --name-only --pretty=format: 2>/dev/null | \
  grep -iE '\.(env|pem|key|p12|pfx|jks|keystore|secret)$|\.env\.' | \
  sort -u || true)

if [ -n "$GHOST_FILES" ]; then
  GIT_ISSUES=$((GIT_ISSUES + 1))
  GHOST_COUNT=$(echo "$GHOST_FILES" | wc -l | tr -d ' ')
  log_crit "$GHOST_COUNT sensitive file(s) deleted from HEAD but still in git history:"
  echo "$GHOST_FILES" | while IFS= read -r f; do
    log_info "  $f"
  done
  add_warning "Sensitive files in git history" \
    "$GHOST_COUNT file(s) matching secret patterns were committed and later deleted. \
Their contents are still readable via 'git log --all'. Run 'git filter-repo' or \
BFG Repo Cleaner to purge them, then force-push and rotate any exposed credentials."
  result_json "git-history" "high" "Sensitive files in git history" \
    "$GHOST_COUNT deleted secret files still in history" "false"
else
  log_ok "No sensitive files found deleted-but-still-in-history"
fi

echo "| git history | — | $GIT_ISSUES | — | — |" >>"$REPORT_MD"

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
  echo "  ⚠️  Audit complete — fixable issues and warnings found"
  echo "  📄 Full report: audit-report.md"
elif [ "$HAS_FIXES" = true ]; then
  echo "  ⚠️  Audit complete — fixable issues found"
  echo "  📄 Full report: audit-report.md"
elif [ "$HAS_WARNINGS" = true ]; then
  echo "  ⚠️  Audit complete — warnings found (no auto-fixable issues)"
  echo "  📄 Full report: audit-report.md"
else
  echo "  ✅ Audit complete — no issues found"
fi
echo "══════════════════════════════════════════════"

# Encode findings in exit code for CI (continue-on-error: true ignores this;
# GITHUB_OUTPUT step vars are used instead). Locally this is swallowed by the
# pnpm script wrapper so users never see ELIFECYCLE noise.
if [ "$HAS_FIXES" = true ] && [ "$HAS_WARNINGS" = true ]; then
  exit 3
elif [ "$HAS_FIXES" = true ]; then
  exit 1
elif [ "$HAS_WARNINGS" = true ]; then
  exit 2
else
  exit 0
fi
