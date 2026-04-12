#!/usr/bin/env bash
# Usage: ./scripts/assets/upload.sh <local-path> [s3-prefix]
# Example: ./scripts/assets/upload.sh ./temp/assets illustrations
#
# Syncs a local directory to the assets R2 bucket.
# Files named with content hashes (e.g. foo-a3f9b2.svg) get immutable headers.
# All other files get a 1-day TTL.
#
# Required env vars:
#   ASSETS_R2_BUCKET        — R2 bucket name (e.g. assets-jamesmiller-blog)
#   CLOUDFLARE_ACCOUNT_ID   — Cloudflare account ID
#   AWS_ACCESS_KEY_ID       — R2 API token key ID
#   AWS_SECRET_ACCESS_KEY   — R2 API token secret

set -euo pipefail

ASSETS_BUCKET="${ASSETS_R2_BUCKET:?Set ASSETS_R2_BUCKET env var}"
R2_ENDPOINT="https://${CLOUDFLARE_ACCOUNT_ID:?Set CLOUDFLARE_ACCOUNT_ID env var}.r2.cloudflarestorage.com"
LOCAL_PATH="${1:?Usage: upload.sh <local-path> [s3-prefix]}"
S3_PREFIX="${2:-}"

S3_DEST="s3://${ASSETS_BUCKET}/${S3_PREFIX}"

echo "Uploading versioned assets (immutable)..."
aws s3 sync "${LOCAL_PATH}" "${S3_DEST}" \
  --endpoint-url "${R2_ENDPOINT}" \
  --region auto \
  --exclude "*" \
  --include "*-[a-f0-9][a-f0-9][a-f0-9][a-f0-9][a-f0-9][a-f0-9].*" \
  --cache-control "public, max-age=31536000, immutable" \
  --no-progress

echo "Uploading unversioned assets (1-day TTL)..."
aws s3 sync "${LOCAL_PATH}" "${S3_DEST}" \
  --endpoint-url "${R2_ENDPOINT}" \
  --region auto \
  --exclude "*-[a-f0-9][a-f0-9][a-f0-9][a-f0-9][a-f0-9][a-f0-9].*" \
  --cache-control "public, max-age=86400" \
  --no-progress

echo "Done. Assets synced to ${S3_DEST}"
