// Visual snapshot tests (QA-5). These run against a running web app at
// `E2E_BASE_URL` (default http://localhost:3000) and store baseline
// screenshots under `e2e/__snapshots__/`. They are a smoke check for
// chrome regressions, not pixel-perfect tests — `maxDiffPixelRatio`
// is intentionally generous so font hinting / antialiasing differences
// across runners do not cause false positives.

import { expect, test } from "@playwright/test";

const PUBLIC_ROUTES = [
  { name: "home", path: "/" },
  { name: "login", path: "/login" },
  { name: "register", path: "/register" },
  { name: "get-the-app", path: "/get-the-app" },
];

for (const route of PUBLIC_ROUTES) {
  test(`visual: ${route.name}`, async ({ page }) => {
    await page.goto(route.path);
    await page.waitForLoadState("networkidle");
    // Hide volatile elements (timestamps, animations).
    await page.addStyleTag({
      content: `
        [data-testid="timestamp"], time, .animate-pulse, .animate-spin {
          visibility: hidden !important;
        }
      `,
    });
    await expect(page).toHaveScreenshot(`${route.name}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
      caret: "hide",
    });
  });
}
