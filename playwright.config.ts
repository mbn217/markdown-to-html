import { defineConfig, devices } from "@playwright/test";

const pagesMode = process.env.PLAYWRIGHT_PAGES === "true";
const baseURL = process.env.PLAYWRIGHT_BASE_URL || (pagesMode
  ? "http://127.0.0.1:4173/markdown-to-html/"
  : "http://localhost:3000");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 2,
  reporter: "list",
  use: {
    baseURL,
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: pagesMode ? "npm run preview:pages" : process.env.CI ? "npm run start" : "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});