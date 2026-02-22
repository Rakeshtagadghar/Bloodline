import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "apps/web/e2e",
  testIgnore: ["**/tree-harness.spec.ts"],
  fullyParallel: true,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: "disabled"
    }
  },
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  webServer: {
    command: "pnpm --filter @bloodline/web dev --hostname 127.0.0.1 --port 3000",
    url: "http://127.0.0.1:3000/tree",
    reuseExistingServer: true,
    timeout: 60_000
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 }
      }
    }
  ]
});
