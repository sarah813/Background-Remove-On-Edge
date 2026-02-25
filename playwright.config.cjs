const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/e2e",
  testIgnore: "**/real-model-smoke.spec.cjs",
  timeout: 45000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      VITE_E2E_MOCK_INFERENCE: process.env.VITE_E2E_MOCK_INFERENCE || "1",
    },
  },
});
