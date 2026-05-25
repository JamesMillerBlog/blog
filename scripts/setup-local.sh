#!/usr/bin/env bash
set -euo pipefail

# Only run in local development — skip in CI
[ -n "${CI:-}" ] && exit 0

echo "✓ local dev setup complete"
