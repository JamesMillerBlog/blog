#!/bin/bash
set -euo pipefail

# Generates a Playwright E2E test file from the issue description using AI,
# then writes it to web/e2e/ai-generated.spec.ts for the CI test run.

OUTPUT_FILE="web/e2e/ai-generated.spec.ts"
mkdir -p web/e2e

PROMPT="You are an expert Playwright test author. Generate a TypeScript Playwright test file for the feature described below.

Requirements:
- Import from '@playwright/test'
- Test the happy path described in the acceptance criteria
- Test at least one edge case or error state
- Use descriptive test names that match the acceptance criteria
- Use data-testid selectors where possible, fall back to role/text selectors
- Keep tests independent (no shared state between tests)
- The baseURL is set in playwright.config.ts — use relative paths like page.goto('/')
- Do NOT include any explanation or markdown — output ONLY the TypeScript file content

Feature: ${ISSUE_TITLE}

Description:
${ISSUE_BODY}

Preview URL (for context only — tests use relative paths via baseURL): ${PREVIEW_URL:-http://localhost:3000}"

printf '%s' "$PROMPT" \
  | pi --agent-team-subagent-skills disabled --model opencode-go/deepseek-v4-pro \
  2>/dev/null \
  | grep -v '^```' \
  > "$OUTPUT_FILE" || true

if [[ ! -s "$OUTPUT_FILE" ]]; then
  echo "AI test generation produced no output, writing placeholder" >&2
  cat > "$OUTPUT_FILE" << 'EOF'
import { test, expect } from '@playwright/test'

test('page loads successfully', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/.+/)
})
EOF
fi

echo "Generated tests written to ${OUTPUT_FILE}" >&2
cat "$OUTPUT_FILE" >&2
