import { test, expect } from "@playwright/test";

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="identifier"]', "testuser@example.com");
    await page.fill('[name="password"]', "Test1234!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/feed");
  });

  test("navigate to settings page", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("h1")).toContainText(/settings/i);
  });

  test("update profile info", async ({ page }) => {
    await page.goto("/settings/profile");
    await page.fill('[name="first_name"]', "Updated");
    await page.click('button[type="submit"]');
    await expect(page.locator('[role="status"], .toast')).toBeVisible({ timeout: 5000 });
  });

  test("navigate to privacy settings", async ({ page }) => {
    await page.goto("/settings/privacy");
    await expect(page.locator("h1, h2")).toBeVisible();
  });

  test("navigate to password settings", async ({ page }) => {
    await page.goto("/settings/password");
    await expect(page.locator('[name="current_password"]')).toBeVisible();
  });
});
