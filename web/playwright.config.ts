import { defineConfig, devices } from '@playwright/test'

const remoteUrl = process.env.PLAYWRIGHT_BASE_URL

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  outputDir: './e2e/test-results',
  reporter: [['html', { outputFolder: './e2e/playwright-report' }]],
  use: {
    baseURL: remoteUrl ?? 'http://localhost:3000',
    httpCredentials: process.env.PLAYWRIGHT_BASIC_AUTH_USERNAME
      ? {
          username: process.env.PLAYWRIGHT_BASIC_AUTH_USERNAME,
          password: process.env.PLAYWRIGHT_BASIC_AUTH_PASSWORD ?? '',
        }
      : undefined,
    trace: 'on-first-retry',
    video: process.env.CI ? 'on' : 'off',
    screenshot: process.env.CI ? 'only-on-failure' : 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: remoteUrl
    ? undefined
    : {
        command: process.env.CI ? 'pnpm build && pnpm start' : 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 300000,
      },
})
