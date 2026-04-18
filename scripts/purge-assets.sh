#!/usr/bin/env bash
# Usage: ./scripts/assets/purge.sh [path-pattern]
# Example: ./scripts/assets/purge.sh "/archive/my-image.png"
#          ./scripts/assets/purge.sh   (purges entire zone cache)
#
# Purges assets from the Cloudflare CDN cache.
#
# Required env vars:
#   CLOUDFLARE_ZONE_ID   — Cloudflare zone ID
#   CLOUDFLARE_API_TOKEN — Cloudflare API token with Cache Purge permission
#   ASSETS_DOMAIN        — Assets CDN domain (e.g. assets.example.com)

set -euo pipefail

ZONE_ID="${CLOUDFLARE_ZONE_ID:?Set CLOUDFLARE_ZONE_ID env var}"
API_TOKEN="${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN env var}"
ASSETS_DOMAIN="${ASSETS_DOMAIN:?Set ASSETS_DOMAIN env var}"
PATH_PATTERN="${1:-}"

if [[ -z "${PATH_PATTERN}" ]]; then
  echo "Purging entire Cloudflare cache for zone ${ZONE_ID}..."
  PAYLOAD='{"purge_everything":true}'
else
  echo "Purging https://${ASSETS_DOMAIN}${PATH_PATTERN} from Cloudflare cache..."
  PAYLOAD="{\"files\":[\"https://${ASSETS_DOMAIN}${PATH_PATTERN}\"]}"
fi

curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data "${PAYLOAD}"

echo ""
echo "Done."
