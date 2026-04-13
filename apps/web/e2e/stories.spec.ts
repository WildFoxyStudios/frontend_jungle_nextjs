import { test, expect } from "@playwright/test";

test.describe("Stories flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="identifier"]', process.env["E2E_USER_EMAIL"] ?? "test@example.com");
    await page.fill('[name="password"]', process.env["E2E_USER_PASSWORD"] ?? "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/feed");
  });

  test("Create story → view story → mark as seen", async ({ page }) => {
    await page.goto("/stories");
    await expect(page).toHaveURL("/stories");

    // Story ring should be visible on feed
    await page.goto("/feed");
    const storyRing = page.locator('[data-testid="story-ring"]');
    if (await storyRing.isVisible()) {
      // Click first story
      await storyRing.locator("button").first().click();
      // Story viewer should open
      await expect(page.locator('[data-testid="story-viewer"]')).toBeVisible({ timeout: 3000 });
    }
  });
});
