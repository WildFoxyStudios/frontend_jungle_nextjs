import { test, expect } from "@playwright/test";

test.describe("Payment", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="identifier"]', "testuser@example.com");
    await page.fill('[name="password"]', "Test1234!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/feed");
  });

  test("navigate to wallet page", async ({ page }) => {
    await page.goto("/wallet");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("navigate to go pro page", async ({ page }) => {
    await page.goto("/go-pro");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("wallet shows balance", async ({ page }) => {
    await page.goto("/wallet");
    await expect(page.locator("text=/balance/i")).toBeVisible();
  });
});
