#!/bin/bash
set -euo pipefail

# =============================================================================
# Security Audit — Tool Setup + Runner
# =============================================================================
# Installs required tools if missing, then runs scripts/security-audit.sh.
# Works both locally (pnpm audit:security) and in CI (security-audit.yml).
#
# Tool versions — bump here to upgrade everywhere:
SEMGREP_SPEC='semgrep>=1.0.0,<2.0.0'
TRIVY_VERSION='0.70.0'
ZIZMOR_VERSION='1.25.2'
GITLEAKS_VERSION='8.30.1'
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Install to /usr/local/bin when root (CI), or ~/.local/bin when non-root (local)
if [ "$(id -u)" = '0' ]; then
  BIN_DIR='/usr/local/bin'
else
  BIN_DIR="$HOME/.local/bin"
  mkdir -p "$BIN_DIR"
  export PATH="$BIN_DIR:$PATH"
fi

install_binary() {
  local name="$1" url="$2" checksums_url="$3" binary_in_archive="$4"
  local tmp
  tmp=$(mktemp -d)
  local archive="$tmp/archive.tar.gz"
  local checksums="$tmp/checksums.txt"
  curl -sL "$url" -o "$archive"
  curl -sL "$checksums_url" -o "$checksums"
  # Rename archive to expected filename so sha256sum --check can match it
  local expected_name
  expected_name="$(basename "$url")"
  cp "$archive" "$tmp/$expected_name"
  (cd "$tmp" && sha256sum --check --ignore-missing "checksums.txt")
  tar -xzf "$archive" -C "$BIN_DIR" "$binary_in_archive"
  rm -rf "$tmp"
}

echo '→ Checking audit tools...'

if ! command -v semgrep >/dev/null 2>&1; then
  echo '  Installing semgrep...'
  if command -v brew >/dev/null 2>&1; then
    brew install semgrep
  elif command -v pipx >/dev/null 2>&1; then
    pipx install semgrep
  elif [ "$(id -u)" = '0' ]; then
    python3 -m pip install --quiet "$SEMGREP_SPEC"
  else
    echo '  Warning: cannot install semgrep automatically — install via: brew install semgrep'
    echo '  Continuing without semgrep (SAST checks will be skipped)...'
  fi
fi

if ! command -v trivy >/dev/null 2>&1; then
  echo '  Installing trivy...'
  install_binary trivy \
    "https://github.com/aquasecurity/trivy/releases/download/v${TRIVY_VERSION}/trivy_${TRIVY_VERSION}_Linux-64bit.tar.gz" \
    "https://github.com/aquasecurity/trivy/releases/download/v${TRIVY_VERSION}/trivy_${TRIVY_VERSION}_checksums.txt" \
    trivy
fi

if ! command -v zizmor >/dev/null 2>&1; then
  echo '  Installing zizmor...'
  install_binary zizmor \
    "https://github.com/zizmorcore/zizmor/releases/download/v${ZIZMOR_VERSION}/zizmor_${ZIZMOR_VERSION}_linux_amd64.tar.gz" \
    "https://github.com/zizmorcore/zizmor/releases/download/v${ZIZMOR_VERSION}/zizmor_${ZIZMOR_VERSION}_checksums.txt" \
    zizmor
fi

if ! command -v gitleaks >/dev/null 2>&1; then
  echo '  Installing gitleaks...'
  install_binary gitleaks \
    "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz" \
    "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_checksums.txt" \
    gitleaks
fi

if ! command -v jq >/dev/null 2>&1; then
  echo '  Installing jq...'
  if command -v apt-get >/dev/null 2>&1; then
    if [ "$(id -u)" = '0' ]; then
      apt-get update -qq && apt-get install -y -qq jq >/dev/null
    else
      sudo apt-get update -qq && sudo apt-get install -y -qq jq >/dev/null
    fi
  elif command -v brew >/dev/null 2>&1; then
    brew install jq
  else
    echo '  Warning: cannot install jq automatically — please install it manually'
  fi
fi

# GITHUB_OUTPUT is set by the Actions runner; for local runs point it at a temp
# file so security-audit.sh can write step outputs without erroring under set -u
export GITHUB_OUTPUT="${GITHUB_OUTPUT:-$(mktemp)}"

echo '→ Running security audit...'
exec bash "${SCRIPT_DIR}/security-audit.sh" "$@"
