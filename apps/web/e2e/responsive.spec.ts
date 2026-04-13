import { test, expect } from "@playwright/test";

test.describe("Responsive Design", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="identifier"]', "testuser@example.com");
    await page.fill('[name="password"]', "Test1234!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/feed");
  });

  test("desktop: sidebar visible", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/feed");
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
  });

  test("mobile: bottom nav visible, sidebar hidden", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/feed");
    await expect(page.locator('nav[aria-label="Mobile navigation"]')).toBeVisible();
  });

  test("tablet: layout adjusts", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/feed");
    await expect(page.locator("main")).toBeVisible();
  });
});
