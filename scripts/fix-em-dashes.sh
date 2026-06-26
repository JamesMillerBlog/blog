#!/usr/bin/env bash
# Replace em dashes (—) with hyphens (-) in TS/TSX/JS/JSX source files.
set -euo pipefail

TARGET_DIR="${1:-src}"

find "${TARGET_DIR}" -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' \) \
  -print0 | xargs -0 perl -i -pe 's/\xe2\x80\x94/-/g'

echo "Em dash fix complete: ${TARGET_DIR}"
