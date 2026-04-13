import { test, expect } from "@playwright/test";

test.describe("Funding", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="identifier"]', "testuser@example.com");
    await page.fill('[name="password"]', "Test1234!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/feed");
  });

  test("navigate to funding page", async ({ page }) => {
    await page.goto("/funding");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("create a funding campaign", async ({ page }) => {
    await page.goto("/funding/create");
    await page.fill('[name="title"]', "E2E Test Campaign");
    await page.fill('[name="goal_amount"]', "1000");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/funding\/.+/);
  });

  test("view funding detail", async ({ page }) => {
    await page.goto("/funding");
    await page.locator("a[href*='/funding/']").first().click();
    await expect(page.locator("h1")).toBeVisible();
  });
});
