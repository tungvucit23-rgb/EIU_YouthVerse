import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.config";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const port = new URL(baseURL).port || "3000";

/** React reports attribute hydration mismatches in development, so these tests need next dev. */
export default defineConfig({
  ...baseConfig,
  testMatch: "**/hydration.spec.ts",
  testIgnore: [],
  use: { ...baseConfig.use, baseURL },
  webServer: {
    command: `node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
