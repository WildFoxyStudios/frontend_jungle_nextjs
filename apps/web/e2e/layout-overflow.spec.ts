import { test, expect } from "@playwright/test";

test.describe("Shell layout overflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="identifier"]', "testuser@example.com");
    await page.fill('[name="password"]', "Test1234!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/feed");
  });

  async function assertNoHorizontalOverflow(page: import("@playwright/test").Page) {
    const extra = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth - doc.clientWidth;
    });
    expect(extra).toBeLessThanOrEqual(4);
  }

  test("feed: no horizontal scroll at desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/feed");
    await page.waitForSelector('[data-testid="main-nav-list"]');
    await assertNoHorizontalOverflow(page);
  });

  test("feed: narrow mobile viewport stays within width", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/feed");
    await assertNoHorizontalOverflow(page);
  });
});
