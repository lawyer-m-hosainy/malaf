// playwright.config.js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 30000, // 30 seconds max per test (was 60s)

  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html-report', open: 'never' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['./helpers/custom-reporter.js'],
  ],

  use: {
    baseURL: 'https://malaf.pro',
    headless: true,
    viewport: { width: 1280, height: 800 },
    screenshot: 'only-on-failure',
    video: 'off',
    trace: 'on-first-retry',

    // Auto-grant permissions for camera/mic tests
    permissions: ['camera', 'microphone'],

    // ❌ NO modifications - read-only audit mode
    // All actions are observational only
  },

  // Only use Chromium — WebKit hangs on Windows for permission prompts
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  outputDir: 'reports/artifacts',
});
