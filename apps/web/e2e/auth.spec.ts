import { test, expect } from "@playwright/test";

test.describe("Auth flow", () => {
  test("Register with email → onboarding flow", async ({ page }) => {
    await page.goto("/register");

    const timestamp = Date.now();
    await page.fill('[name="username"]', `testuser${timestamp}`);
    await page.fill('[name="email"]', `test${timestamp}@example.com`);
    await page.fill('[name="password"]', "password123");
    await page.fill('[name="first_name"]', "Test");
    await page.fill('[name="last_name"]', "User");

    await page.click('button[type="submit"]');

    // Should redirect to onboarding or feed
    await expect(page).toHaveURL(/\/(onboarding|feed)/);
  });
});
