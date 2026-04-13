import { test, expect } from "@playwright/test";

test.describe("Notifications", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="identifier"]', "testuser@example.com");
    await page.fill('[name="password"]', "Test1234!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/feed");
  });

  test("navigate to notifications page", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("notification bell is visible in header", async ({ page }) => {
    await expect(page.locator('a[href="/notifications"]')).toBeVisible();
  });

  test("mark all as read", async ({ page }) => {
    await page.goto("/notifications");
    const markAllBtn = page.getByRole("button", { name: /mark all|read all/i });
    if (await markAllBtn.isVisible()) {
      await markAllBtn.click();
    }
  });
});
