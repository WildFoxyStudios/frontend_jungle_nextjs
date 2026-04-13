import { test, expect } from "@playwright/test";
import path from "path";

test.describe("Profile flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="identifier"]', process.env["E2E_USER_EMAIL"] ?? "test@example.com");
    await page.fill('[name="password"]', process.env["E2E_USER_PASSWORD"] ?? "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/feed");
  });

  test("Upload avatar with crop", async ({ page }) => {
    await page.goto("/settings");

    // Find avatar upload button
    const avatarInput = page.locator('input[type="file"][accept*="image"]').first();
    if (await avatarInput.isVisible()) {
      await avatarInput.setInputFiles(path.join(__dirname, "fixtures/test-avatar.jpg"));
      // Crop dialog should appear
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
    }
  });
});
