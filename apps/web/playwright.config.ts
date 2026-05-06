import { defineConfig, devices } from "@playwright/test";

/** When set (e.g. staging), tests hit that URL and no local server is spawned. */
const baseURL = process.env["E2E_BASE_URL"] ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  workers: process.env["CI"] ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  /** Start Next.js when targeting localhost (skip if `E2E_BASE_URL` points elsewhere). */
  webServer: process.env["E2E_BASE_URL"]
    ? undefined
    : {
        command: "pnpm run dev",
        url: baseURL,
        reuseExistingServer: !process.env["CI"],
        timeout: 180_000,
      },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
