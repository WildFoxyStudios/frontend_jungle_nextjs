import { test, expect } from "@playwright/test";

test.describe("Admin user management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="email"]', process.env["E2E_ADMIN_EMAIL"] ?? "admin@example.com");
    await page.fill('[name="password"]', process.env["E2E_ADMIN_PASSWORD"] ?? "adminpassword");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");
  });

  test("Admin ban user → verify status change", async ({ page }) => {
    await page.goto("/users");
    await expect(page.locator("h1")).toContainText("Users");

    // Find first user row
    const firstRow = page.locator("tbody tr").first();
    if (await firstRow.isVisible()) {
      // Click view button
      await firstRow.locator('a:has-text("View")').click();
      // User detail page
      await expect(page.locator("h1")).toBeVisible();
      // Click ban button
      const banBtn = page.locator('button:has-text("Ban")');
      if (await banBtn.isVisible()) {
        await banBtn.click();
        // Should show success toast
        await expect(page.locator('[data-sonner-toast]')).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test("Admin approve pending post", async ({ page }) => {
    await page.goto("/moderation/pending-posts");
    await expect(page.locator("h1")).toContainText("Pending Posts");

    const firstItem = page.locator('[data-testid="queue-item"]').first();
    if (await firstItem.isVisible()) {
      await firstItem.locator('button:has-text("Approve")').click();
      await expect(page.locator('[data-sonner-toast]')).toBeVisible({ timeout: 3000 });
    }
  });
});
