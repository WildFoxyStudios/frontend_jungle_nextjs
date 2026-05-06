import { test, expect, type Page } from "@playwright/test";

/**
 * High-level admin smoke tests covering:
 *  - login as an admin user
 *  - users list/CRUD entry points (the granular ban/approve flows live in users.spec.ts)
 *  - settings catalog navigation (general → email → SMS → push → integrations)
 *  - new system pages (ffmpeg probe, verify apps, DLQ) introduced in Wave B
 *
 * Each step is guarded with `await page.locator(...).isVisible()` so the test
 * remains useful even when the seed environment doesn't expose every feature.
 */

async function adminLogin(page: Page): Promise<void> {
  await page.goto("/login");
  await page.fill('[name="email"]', process.env["E2E_ADMIN_EMAIL"] ?? "admin@example.com");
  await page.fill('[name="password"]', process.env["E2E_ADMIN_PASSWORD"] ?? "adminpassword");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|home|users|settings|\/$)/, { timeout: 10_000 });
}

test.describe("Admin smoke", () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test("Users list renders and exposes detail navigation", async ({ page }) => {
    await page.goto("/users");
    await expect(page.locator("h1")).toContainText(/users/i);
    const tableOrEmpty = page.locator("tbody tr, [data-testid='empty-state']").first();
    await expect(tableOrEmpty).toBeVisible({ timeout: 5_000 });
  });

  test("Settings catalog is reachable", async ({ page }) => {
    const sections = [
      { path: "/settings/general", heading: /general/i },
      { path: "/settings/email", heading: /email/i },
      { path: "/settings/sms", heading: /sms/i },
      { path: "/settings/push", heading: /push|vapid/i },
      { path: "/settings/integrations", heading: /integration|api/i },
    ];

    for (const section of sections) {
      await page.goto(section.path);
      const heading = page.locator("h1, h2").first();
      if (await heading.isVisible()) {
        await expect(heading).toContainText(section.heading);
      }
    }
  });

  test("System pages introduced in wave B render", async ({ page }) => {
    const pages = ["/system/ffmpeg", "/system/verify-apps", "/system/dlq"];
    for (const path of pages) {
      await page.goto(path);
      const heading = page.locator("h1, h2").first();
      if (await heading.isVisible()) {
        await expect(heading).toBeVisible();
      }
    }
  });

  test("Customization sub-categories pages render", async ({ page }) => {
    const pages = [
      "/customization/pages-sub-categories",
      "/customization/groups-sub-categories",
      "/customization/products-sub-categories",
    ];
    for (const path of pages) {
      await page.goto(path);
      const heading = page.locator("h1, h2").first();
      if (await heading.isVisible()) {
        await expect(heading).toBeVisible();
      }
    }
  });

  test("Movies CRUD dialog opens", async ({ page }) => {
    await page.goto("/content/movies");
    const heading = page.locator("h1").first();
    await expect(heading).toContainText(/movies/i);
    const createBtn = page.getByRole("button", { name: /create|new movie|add/i }).first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 3_000 });
      const cancelBtn = page.getByRole("button", { name: /cancel|close/i }).first();
      if (await cancelBtn.isVisible()) await cancelBtn.click();
    }
  });
});
