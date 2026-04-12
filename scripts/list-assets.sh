#!/usr/bin/env bash
# Usage: ./scripts/assets/list.sh [r2-prefix]
# Example: ./scripts/assets/list.sh archive
#          ./scripts/assets/list.sh   (lists all assets)
#
# Lists assets in the R2 bucket with sizes, sorted by size descending.
#
# Required env vars:
#   ASSETS_R2_BUCKET      — R2 bucket name
#   CLOUDFLARE_ACCOUNT_ID — Cloudflare account ID
#   AWS_ACCESS_KEY_ID     — R2 API token key ID
#   AWS_SECRET_ACCESS_KEY — R2 API token secret

set -euo pipefail

ASSETS_BUCKET="${ASSETS_R2_BUCKET:?Set ASSETS_R2_BUCKET env var}"
R2_ENDPOINT="https://${CLOUDFLARE_ACCOUNT_ID:?Set CLOUDFLARE_ACCOUNT_ID env var}.r2.cloudflarestorage.com"
S3_PREFIX="${1:-}"

echo "Listing assets in s3://${ASSETS_BUCKET}/${S3_PREFIX}"
echo "---"

aws s3 ls "s3://${ASSETS_BUCKET}/${S3_PREFIX}" \
  --endpoint-url "${R2_ENDPOINT}" \
  --region auto \
  --recursive \
  --human-readable \
  | sort -rh -k3 \
  | awk '{printf "%-12s %s\n", $3, $4}'

echo "---"
TOTAL=$(aws s3 ls "s3://${ASSETS_BUCKET}/${S3_PREFIX}" \
  --endpoint-url "${R2_ENDPOINT}" \
  --region auto \
  --recursive \
  --summarize \
  | grep "Total Size" | awk '{print $3, $4}')
echo "Total: ${TOTAL}"
