import { test, expect } from "@playwright/test";

test.describe("Groups", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="identifier"]', "testuser@example.com");
    await page.fill('[name="password"]', "Test1234!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/feed");
  });

  test("navigate to groups page", async ({ page }) => {
    await page.goto("/groups");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("create a new group", async ({ page }) => {
    await page.goto("/groups/create");
    await page.fill('[name="name"]', "E2E Test Group");
    await page.fill('[name="category"]', "Technology");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/groups\/.+/);
  });

  test("view group detail", async ({ page }) => {
    await page.goto("/groups");
    await page.locator("a[href*='/groups/']").first().click();
    await expect(page.locator("h1")).toBeVisible();
  });

  test("join and leave group", async ({ page }) => {
    await page.goto("/groups");
    await page.locator("a[href*='/groups/']").first().click();
    const joinBtn = page.getByRole("button", { name: /join/i });
    if (await joinBtn.isVisible()) {
      await joinBtn.click();
      await expect(page.getByRole("button", { name: /leave/i })).toBeVisible();
    }
  });
});
