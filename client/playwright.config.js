import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  use: {
    // Playwright runs against this temporary local test site only; this value is
    // test-runner configuration and is not included in the production bundle.
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: 'mobile',
      testIgnore: '**/responsive.spec.js',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' },
    },
  ],
  webServer: {
    // This command starts an isolated local Vite server for browser tests only.
    command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort',
    // Playwright uses this local URL only to detect when its test server is ready.
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
})
