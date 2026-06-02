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

OS="$(uname -s)"   # Linux | Darwin
ARCH="$(uname -m)" # x86_64 | arm64 | aarch64

# Install to /usr/local/bin when root (CI), or ~/.local/bin when non-root (local)
if [ "$(id -u)" = '0' ]; then
  BIN_DIR='/usr/local/bin'
else
  BIN_DIR="$HOME/.local/bin"
  mkdir -p "$BIN_DIR"
  export PATH="$BIN_DIR:$PATH"
fi

# Portable SHA-256 checksum verification (sha256sum on Linux, shasum on macOS)
checksum_verify() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum --check --ignore-missing "$1"
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 --check --ignore-missing "$1"
  else
    echo '  Warning: no sha256 tool found — skipping checksum verification'
  fi
}

install_binary() {
  local name="$1" url="$2" checksums_url="$3" binary_in_archive="$4"
  local tmp
  tmp=$(mktemp -d)
  local archive="$tmp/archive.tar.gz"
  local checksums="$tmp/checksums.txt"
  local expected_name
  expected_name="$(basename "$url")"

  echo "  Installing $name..."

  if ! curl -sfL "$url" -o "$archive"; then
    echo "  Warning: failed to download $name (HTTP error or URL not found) — skipping"
    echo "  URL: $url"
    rm -rf "$tmp"
    return 1
  fi
  if ! curl -sfL "$checksums_url" -o "$checksums"; then
    echo "  Warning: failed to download $name checksums — skipping"
    rm -rf "$tmp"
    return 1
  fi

  # Rename archive to expected filename so checksum tool can match it
  cp "$archive" "$tmp/$expected_name"
  if ! (cd "$tmp" && checksum_verify "checksums.txt"); then
    echo "  Warning: checksum verification failed for $name — skipping"
    rm -rf "$tmp"
    return 1
  fi

  if ! tar -xzf "$archive" -C "$BIN_DIR" "$binary_in_archive"; then
    echo "  Warning: failed to extract $name — skipping"
    rm -rf "$tmp"
    return 1
  fi

  rm -rf "$tmp"
}

echo '→ Checking audit tools...'

if ! command -v semgrep >/dev/null 2>&1; then
  echo '  Installing semgrep...'
  if command -v pipx >/dev/null 2>&1; then
    pipx install semgrep
  elif [ "$(id -u)" = '0' ]; then
    python3 -m pip install --quiet "$SEMGREP_SPEC"
  else
    echo '  Warning: cannot install semgrep — install via: pipx install semgrep'
    echo '  Continuing without semgrep (SAST checks will be skipped)...'
  fi
fi

if ! command -v trivy >/dev/null 2>&1; then
  echo '  Installing trivy...'
  case "${OS}-${ARCH}" in
    Linux-x86_64)   TRIVY_ARCHIVE="trivy_${TRIVY_VERSION}_Linux-64bit.tar.gz" ;;
    Darwin-arm64)   TRIVY_ARCHIVE="trivy_${TRIVY_VERSION}_macOS-ARM64.tar.gz" ;;
    Darwin-x86_64)  TRIVY_ARCHIVE="trivy_${TRIVY_VERSION}_macOS-64bit.tar.gz" ;;
    *) echo "  Warning: unsupported platform ${OS}-${ARCH} for trivy — skipping"; TRIVY_ARCHIVE='' ;;
  esac
  if [ -n "${TRIVY_ARCHIVE:-}" ]; then
    install_binary trivy \
      "https://github.com/aquasecurity/trivy/releases/download/v${TRIVY_VERSION}/${TRIVY_ARCHIVE}" \
      "https://github.com/aquasecurity/trivy/releases/download/v${TRIVY_VERSION}/trivy_${TRIVY_VERSION}_checksums.txt" \
      trivy || echo '  Continuing without trivy (container/IaC checks will be skipped)...'
  fi
fi

if ! command -v zizmor >/dev/null 2>&1; then
  case "${OS}-${ARCH}" in
    Linux-x86_64)        ZIZMOR_ARCHIVE="zizmor_${ZIZMOR_VERSION}_linux_amd64.tar.gz" ;;
    Darwin-arm64|Darwin-aarch64) ZIZMOR_ARCHIVE="zizmor_${ZIZMOR_VERSION}_darwin_arm64.tar.gz" ;;
    Darwin-x86_64)       ZIZMOR_ARCHIVE="zizmor_${ZIZMOR_VERSION}_darwin_x86_64.tar.gz" ;;
    *) echo "  Warning: unsupported platform ${OS}-${ARCH} for zizmor — skipping"; ZIZMOR_ARCHIVE='' ;;
  esac
  if [ -n "${ZIZMOR_ARCHIVE:-}" ]; then
    install_binary zizmor \
      "https://github.com/woodruffw/zizmor/releases/download/v${ZIZMOR_VERSION}/${ZIZMOR_ARCHIVE}" \
      "https://github.com/woodruffw/zizmor/releases/download/v${ZIZMOR_VERSION}/zizmor_${ZIZMOR_VERSION}_checksums.txt" \
      zizmor || echo '  Continuing without zizmor (GitHub Actions checks will be skipped)...'
  fi
fi

if ! command -v gitleaks >/dev/null 2>&1; then
  case "${OS}-${ARCH}" in
    Linux-x86_64)        GITLEAKS_ARCHIVE="gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz" ;;
    Darwin-arm64|Darwin-aarch64) GITLEAKS_ARCHIVE="gitleaks_${GITLEAKS_VERSION}_darwin_arm64.tar.gz" ;;
    Darwin-x86_64)       GITLEAKS_ARCHIVE="gitleaks_${GITLEAKS_VERSION}_darwin_x64.tar.gz" ;;
    *) echo "  Warning: unsupported platform ${OS}-${ARCH} for gitleaks — skipping"; GITLEAKS_ARCHIVE='' ;;
  esac
  if [ -n "${GITLEAKS_ARCHIVE:-}" ]; then
    install_binary gitleaks \
      "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/${GITLEAKS_ARCHIVE}" \
      "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_checksums.txt" \
      gitleaks || echo '  Continuing without gitleaks (secret scanning will be skipped)...'
  fi
fi

if ! command -v jq >/dev/null 2>&1; then
  echo '  Installing jq...'
  if command -v brew >/dev/null 2>&1; then
    brew install jq
  elif command -v apt-get >/dev/null 2>&1; then
    if [ "$(id -u)" = '0' ]; then
      apt-get update -qq && apt-get install -y -qq jq >/dev/null
    else
      sudo apt-get update -qq && sudo apt-get install -y -qq jq >/dev/null
    fi
  else
    echo '  Warning: cannot install jq automatically — please install it manually'
  fi
fi

# Ensure PCRE grep is available (GNU grep -P) — required for sections 13–15.
# macOS ships BSD grep which lacks -P; GNU grep installs as 'ggrep' via brew.
if grep -qP '' /dev/null 2>/dev/null; then
  export GREP_P=grep
elif command -v ggrep >/dev/null 2>&1; then
  export GREP_P=ggrep
elif command -v brew >/dev/null 2>&1; then
  echo '  Installing GNU grep (required for markdown/source/prompt checks)...'
  if brew install grep >/dev/null 2>&1 && command -v ggrep >/dev/null 2>&1; then
    export GREP_P=ggrep
  else
    echo '  Warning: brew install grep failed — sections 13-15 will skip PCRE checks'
    export GREP_P=grep
  fi
else
  echo '  Warning: grep -P (PCRE) not available — sections 13-15 will be skipped'
  echo '  Install GNU grep (brew install grep on macOS) to enable these checks.'
  export GREP_P=grep
fi

# GITHUB_OUTPUT is set by the Actions runner; for local runs point it at a temp
# file so security-audit.sh can write step outputs without erroring under set -u
export GITHUB_OUTPUT="${GITHUB_OUTPUT:-$(mktemp)}"

echo '→ Running security audit...'
exec bash "${SCRIPT_DIR}/security-audit.sh" "$@"
