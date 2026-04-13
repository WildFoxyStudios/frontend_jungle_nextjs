import { test, expect } from "@playwright/test";

test.describe("Media Upload", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="identifier"]', "testuser@example.com");
    await page.fill('[name="password"]', "Test1234!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/feed");
  });

  test("post creation form has media upload button", async ({ page }) => {
    await page.goto("/feed");
    const mediaBtn = page.locator('button[aria-label*="media"], button[aria-label*="photo"], button[aria-label*="image"]');
    await expect(mediaBtn.first()).toBeVisible();
  });

  test("profile avatar change button visible", async ({ page }) => {
    await page.goto("/settings/profile");
    const avatarSection = page.locator('input[type="file"], button:has-text("avatar"), [aria-label*="avatar"]');
    await expect(avatarSection.first()).toBeVisible();
  });
});
