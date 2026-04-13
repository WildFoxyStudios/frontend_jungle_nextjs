import { test, expect } from "@playwright/test";

test.describe("Jobs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="identifier"]', "testuser@example.com");
    await page.fill('[name="password"]', "Test1234!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/feed");
  });

  test("navigate to jobs page", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("view job detail", async ({ page }) => {
    await page.goto("/jobs");
    await page.locator("a[href*='/jobs/']").first().click();
    await expect(page.locator("h1")).toBeVisible();
  });

  test("create a job listing", async ({ page }) => {
    await page.goto("/jobs/create");
    await page.fill('[name="title"]', "E2E Test Job");
    await page.fill('[name="description"]', "This is a test job listing for E2E tests.");
    await page.fill('[name="location"]', "Remote");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/jobs\/.+/);
  });
});
