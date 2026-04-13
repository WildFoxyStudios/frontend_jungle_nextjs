import { test, expect } from "@playwright/test";

test.describe("Pages", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="identifier"]', "testuser@example.com");
    await page.fill('[name="password"]', "Test1234!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/feed");
  });

  test("navigate to pages listing", async ({ page }) => {
    await page.goto("/pages");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("create a new page", async ({ page }) => {
    await page.goto("/pages/create");
    await page.fill('[name="name"]', "E2E Test Page");
    await page.fill('[name="category"]', "Business");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/pages\/.+/);
  });

  test("like a page", async ({ page }) => {
    await page.goto("/pages");
    await page.locator("a[href*='/pages/']").first().click();
    const likeBtn = page.getByRole("button", { name: /like/i });
    if (await likeBtn.isVisible()) {
      await likeBtn.click();
    }
  });
});
