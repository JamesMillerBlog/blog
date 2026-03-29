import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('logo links back to home from any page', async ({ page }) => {
    await page.goto('/projects')
    await page.locator('img[alt="James Miller Logo"]').click()
    await expect(page).toHaveURL('/')
  })

  test('logo swaps to active image on hover', async ({ page }) => {
    const logo = page.locator('img[alt="James Miller Logo"]').first()
    await expect(logo).toBeVisible()

    // Default logo visible, active logo hidden
    await expect(logo).toHaveCSS('opacity', '1')
    const activeLogo = page.locator('img[src*="logo-active"]')
    await expect(activeLogo).toHaveCSS('opacity', '0')

    // On hover the states swap
    await logo.hover()
    await expect(logo).toHaveCSS('opacity', '0')
    await expect(activeLogo).toHaveCSS('opacity', '1')
  })

  test('Posts nav link is active on home page', async ({ page }) => {
    const postsLink = page.locator('nav a', { hasText: 'Posts' })
    await expect(postsLink).toHaveClass(/bg-secondary-container/)
  })

  test('Projects nav link navigates correctly', async ({ page }) => {
    await page.locator('nav a', { hasText: 'Projects' }).click()
    await expect(page).toHaveURL('/projects')
  })

  test('search opens with Cmd+K', async ({ page }) => {
    await page.keyboard.press('Meta+k')
    await expect(page.locator('[role="dialog"]')).toBeVisible()
  })

  test('mobile menu toggles open and closed', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    const menuButton = page.locator('button[aria-label="Toggle menu"]')
    await menuButton.click()
    await expect(page.locator('text=Posts').nth(1)).toBeVisible()
    await menuButton.click()
    await expect(page.locator('text=Posts').nth(1)).not.toBeVisible()
  })
})
