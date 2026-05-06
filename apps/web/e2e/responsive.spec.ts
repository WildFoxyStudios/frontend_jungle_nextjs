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
    await expect(page.getByTestId("main-nav-list")).toBeVisible();
  });

  test("mobile: no fixed bottom nav, hamburger menu visible", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/feed");
    await expect(page.getByRole("button", { name: "Main menu" })).toBeVisible();
    await expect(page.locator("nav.fixed.bottom-0")).toHaveCount(0);
  });

  test("mobile: hamburger opens main navigation sheet", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/feed");
    await page.getByRole("button", { name: "Main menu" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("link", { name: "Feed" }).first()).toBeVisible();
  });

  test("tablet: layout adjusts", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/feed");
    await expect(page.locator("main")).toBeVisible();
  });
});
