#!/usr/bin/env bash
# Usage: ./scripts/posts/pull.sh [local-path] [s3-prefix]
# Example: ./scripts/posts/pull.sh ./web/_posts
#
# Downloads shared posts from S3 for local editing or preview.

set -euo pipefail

POSTS_BUCKET="${POSTS_S3_BUCKET:?Set POSTS_S3_BUCKET env var}"
LOCAL_PATH="${1:-./web/_posts}"
S3_PREFIX="${2:-}"

mkdir -p "${LOCAL_PATH}"

S3_SOURCE="s3://${POSTS_BUCKET}/${S3_PREFIX}"

echo "Pulling posts from ${S3_SOURCE} to ${LOCAL_PATH}"
aws s3 sync "${S3_SOURCE}" "${LOCAL_PATH}/" \
  --exclude ".DS_Store" \
  --exclude "*.draft.mdx" \
  --no-progress

echo "Done. Posts downloaded to ${LOCAL_PATH}"
