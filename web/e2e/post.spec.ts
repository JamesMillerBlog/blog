import { test, expect } from '@playwright/test';

test.describe('Blog post page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a known published post
    await page.goto('/posts/what-is-webxr-and-why-is-it-so-exciting');
  });

  test('renders navigation and footer', async ({ page }) => {
    await expect(page.locator('img[alt="James Miller Logo"]')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('shows cover image exactly once', async ({ page }) => {
    // The cover image appears in the post header — should not be duplicated in body
    const coverImages = page.locator('header img');
    await expect(coverImages).toHaveCount(1);
  });

  test('title appears exactly once', async ({ page }) => {
    const title = await page.title();
    const postTitle = title.split(' | ')[0];
    const headings = page.locator(`h1:has-text("${postTitle}")`);
    await expect(headings).toHaveCount(1);
  });

  test('breadcrumb navigates back to home', async ({ page }) => {
    await page.locator('text=Back to blog').click();
    await expect(page).toHaveURL('/');
  });

  test('reading progress bar is present', async ({ page }) => {
    await expect(page.locator('div.h-1\\.5.bg-gradient-to-r')).toBeAttached();
  });

  test('shows author name and date', async ({ page }) => {
    await expect(page.locator('text=James Miller')).toBeVisible();
    await expect(page.locator('text=Published')).toBeVisible();
  });
});

test.describe('Draft posts', () => {
  test('draft post returns 404 in production build', async ({ page }) => {
    // mastering-claude-code posts are draft: true
    const response = await page.goto('/posts/mastering-claude-code-01-what-is-it');
    // In dev this will be 200; this test is meaningful in CI against a prod build
    if (process.env.NODE_ENV === 'production') {
      expect(response?.status()).toBe(404);
    }
  });

  test('draft posts do not appear in home page listing', async ({ page }) => {
    await page.goto('/');
    const postLinks = page.locator('a[href*="mastering-claude-code"]');
    if (process.env.NODE_ENV === 'production') {
      await expect(postLinks).toHaveCount(0);
    }
  });
});
