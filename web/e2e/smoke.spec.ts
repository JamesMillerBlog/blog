import { test, expect } from '@playwright/test'

test.describe('Smoke tests', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
  })

  test('logo and navigation render', async ({ page }) => {
    const logo = page.locator('img[alt="James Miller Logo"]')
    await expect(logo).toBeVisible({ timeout: 15000 })

    const postsLink = page.locator('nav >> text=Posts')
    const projectsLink = page.locator('nav >> text=Projects')
    await expect(postsLink).toBeVisible()
    await expect(projectsLink).toBeVisible()
  })

  test('tag filtering on home page', async ({ page }) => {
    const tagPills = page.locator('button[data-tag]')
    await expect(tagPills.first()).toBeVisible({ timeout: 15000 })
    expect(await tagPills.count()).toBeGreaterThan(0)

    const specificTag = tagPills.filter({ hasNotText: 'All' }).first()
    if (await specificTag.isVisible()) {
      await specificTag.click()
      await expect(specificTag).toHaveClass(/bg-secondary/)
    }
  })

  test('project category filtering', async ({ page }) => {
    await page.goto('/projects', { waitUntil: 'networkidle' })

    const categoryButtons = page.locator('button[data-category]')
    await expect(categoryButtons.first()).toBeVisible({ timeout: 15000 })
    expect(await categoryButtons.count()).toBeGreaterThan(0)

    await categoryButtons.nth(1).click()
    await expect(categoryButtons.nth(1)).toHaveClass(/bg-secondary/)
  })

  test('blog post opens with breadcrumb and reading progress', async ({ page }) => {
    await page.locator('article h3').first().click()

    await expect(page.locator('text=Back to blog')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('div.h-1\\.5.bg-gradient-to-r')).toBeAttached()
  })
})
