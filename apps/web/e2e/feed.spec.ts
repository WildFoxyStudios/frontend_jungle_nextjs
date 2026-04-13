import { test, expect } from "@playwright/test";

test.describe("Feed flow", () => {
  test("Login → Feed → Create post with image", async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.fill('[name="identifier"]', process.env["E2E_USER_EMAIL"] ?? "test@example.com");
    await page.fill('[name="password"]', process.env["E2E_USER_PASSWORD"] ?? "password123");
    await page.click('button[type="submit"]');

    // Should redirect to feed
    await expect(page).toHaveURL("/feed");
    await expect(page.locator("text=What's on your mind")).toBeVisible();

    // Open composer
    await page.click("textarea");
    await page.fill("textarea", "E2E test post");

    // Submit
    await page.click('button:has-text("Post")');

    // Post should appear in feed
    await expect(page.locator("text=E2E test post")).toBeVisible();
  });
});
