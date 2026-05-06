import { test, expect } from "@playwright/test";

test.describe("Reels", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="identifier"]', process.env["E2E_USER_EMAIL"] ?? "test@example.com");
    await page.fill('[name="password"]', process.env["E2E_USER_PASSWORD"] ?? "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/feed", { timeout: 15000 }).catch(() => undefined);
  });

  test("reels page loads and shows create CTA", async ({ page }) => {
    await page.goto("/reels");
    await expect(page.getByRole("link", { name: /Create/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: "For you" })).toBeVisible();
  });
});
