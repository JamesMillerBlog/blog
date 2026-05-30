/**
 * Accessibility scans using @axe-core/playwright.
 *
 * Run with: pnpm test:e2e --project=a11y
 * Or in CI: pnpm test:e2e
 */

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const ROUTES = [
  { path: '/', name: 'home' },
  { path: '/projects', name: 'projects' },
]

test.describe('Accessibility audits', () => {
  for (const { path, name } of ROUTES) {
    test(`${name} page passes a11y checks`, async ({ page }) => {
      test.setTimeout(60000)
      await page.goto(path, { waitUntil: 'networkidle' })

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      expect(results.violations).toEqual([])
    })
  }

  test('blog post page passes a11y checks', async ({ page }) => {
    test.setTimeout(60000)
    // Navigate via a post link on the home page
    await page.goto('/', { waitUntil: 'networkidle' })

    const postLink = page.locator('a[href*="/posts/"]').first()
    if (await postLink.isVisible()) {
      await postLink.click()
      await page.waitForURL(/\/posts\//)

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      expect(results.violations).toEqual([])
    }
  })
})
