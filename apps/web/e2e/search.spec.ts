import { test, expect } from "@playwright/test";

test.describe("Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="identifier"]', "testuser@example.com");
    await page.fill('[name="password"]', "Test1234!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/feed");
  });

  test("search from header", async ({ page }) => {
    await page.fill("#global-search", "test");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/search\?q=test/);
  });

  test("search results page renders", async ({ page }) => {
    await page.goto("/search?q=hello");
    await expect(page.locator("main")).toBeVisible();
  });

  test("search with empty query stays on page", async ({ page }) => {
    await page.goto("/feed");
    await page.fill("#global-search", "   ");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL("/feed");
  });
});
