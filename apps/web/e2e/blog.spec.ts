import { test, expect } from "@playwright/test";

test.describe("Blog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="identifier"]', "testuser@example.com");
    await page.fill('[name="password"]', "Test1234!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/feed");
  });

  test("navigate to blogs page", async ({ page }) => {
    await page.goto("/blogs");
    await expect(page.locator("h1")).toContainText(/blog/i);
  });

  test("create a new blog post", async ({ page }) => {
    await page.goto("/blogs/create");
    await page.fill('[name="title"]', "E2E Test Blog");
    await page.fill('[name="category"]', "Technology");
    await page.locator(".ProseMirror").fill("This is an end-to-end test blog post with enough content to pass validation requirements.");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/blogs\/.+/);
  });

  test("view blog detail", async ({ page }) => {
    await page.goto("/blogs");
    await page.locator("article a").first().click();
    await expect(page.locator("article")).toBeVisible();
  });
});
