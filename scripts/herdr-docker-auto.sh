#!/bin/bash
# Auto-detect the current worktree and launch Docker Pi through Herdr

set -euo pipefail

AGENT_NAME="${1:-pi-docker}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKTREE_DIR="$SCRIPT_DIR/.."
WORKTREE_DIR="$(cd "$WORKTREE_DIR" && pwd)"

# Find the Herdr workspace ID for this worktree
WORKSPACE_ID=$(herdr workspace list 2>/dev/null \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
path = '$WORKTREE_DIR'
for ws in data.get('result', {}).get('workspaces', []):
    wt = ws.get('worktree', {})
    if wt.get('checkout_path') == path or wt.get('repo_root') == path:
        print(ws['workspace_id'])
        break
" 2>/dev/null || true)

if [[ -z "$WORKSPACE_ID" ]]; then
  echo "Error: No Herdr workspace found for worktree: $WORKTREE_DIR"
  echo "Make sure you've opened this worktree in Herdr first."
  exit 1
fi

# Find the first tab in that workspace
TAB_ID=$(herdr tab list --workspace "$WORKSPACE_ID" 2>/dev/null \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
tabs = data.get('result', {}).get('tabs', [])
if tabs:
    print(tabs[0]['tab_id'])
" 2>/dev/null || true)

if [[ -z "$TAB_ID" ]]; then
  echo "Error: No tab found in workspace $WORKSPACE_ID"
  exit 1
fi

echo "[herdr-docker-auto] Worktree: $WORKTREE_DIR"
echo "[herdr-docker-auto] Workspace: $WORKSPACE_ID"
echo "[herdr-docker-auto] Tab: $TAB_ID"
echo "[herdr-docker-auto] Launching $AGENT_NAME..."

herdr agent start "$AGENT_NAME" \
  --workspace "$WORKSPACE_ID" \
  --tab "$TAB_ID" \
  --split down \
  --focus \
  --cwd "$WORKTREE_DIR" \
  -- ./scripts/pi.sh
