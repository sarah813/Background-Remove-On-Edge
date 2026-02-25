const { defineConfig } = require("@playwright/test");
const baseConfig = require("./playwright.config.cjs");

module.exports = defineConfig({
  ...baseConfig,
  testIgnore: [],
  webServer: {
    ...(baseConfig.webServer || {}),
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    timeout: 180000,
    reuseExistingServer: false,
    env: {
      ...process.env,
      VITE_E2E_MOCK_INFERENCE: "0",
      VITE_FORCE_WASM: "1",
    },
  },
});
