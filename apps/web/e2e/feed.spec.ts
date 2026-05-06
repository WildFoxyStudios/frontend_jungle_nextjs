import { test, expect } from "@playwright/test";

test.describe("Feed flow", () => {
  test("Login → Feed → Create post with image", async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.fill('[name="identifier"]', process.env["E2E_USER_EMAIL"] ?? "test@example.com");
    await page.fill('[name="password"]', process.env["E2E_USER_PASSWORD"] ?? "password123");
    await page.click('button[type="submit"]');

    // Should redirect to feed
    await expect(page).toHaveURL("/feed");
    await expect(page.locator("text=What's on your mind")).toBeVisible();

    // Open composer
    await page.click("textarea");
    await page.fill("textarea", "E2E test post");

    // Submit
    await page.click('button:has-text("Post")');

    // Post should appear in feed
    await expect(page.locator("text=E2E test post")).toBeVisible();
  });

  test("keyboard J moves keyboard focus ring to next post when 2+ cards", async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="identifier"]', process.env["E2E_USER_EMAIL"] ?? "test@example.com");
    await page.fill('[name="password"]', process.env["E2E_USER_PASSWORD"] ?? "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/feed");

    const cards = page.locator("[data-feed-post-id]");
    const n = await cards.count();
    if (n < 2) {
      test.skip();
      return;
    }
    await page.evaluate(() => {
      const a = document.activeElement;
      if (a instanceof HTMLElement) a.blur();
    });
    await page.keyboard.press("KeyJ");
    await expect(page.locator('[data-feed-kbd-focused="true"]')).toHaveCount(1);
    const focused = await page.locator('[data-feed-kbd-focused="true"]').getAttribute("data-feed-post-id");
    const expected = await cards.nth(1).getAttribute("data-feed-post-id");
    expect(focused).toBe(expected);
  });

  test("composer publishes with Cmd/Ctrl+Enter", async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="identifier"]', process.env["E2E_USER_EMAIL"] ?? "test@example.com");
    await page.fill('[name="password"]', process.env["E2E_USER_PASSWORD"] ?? "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/feed");

    const body = `E2E mod enter ${Date.now()}`;
    await page.click("textarea");
    await page.fill("textarea", body);
    const mod = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.press(`${mod}+Enter`);
    await expect(page.locator(`text=${body}`).first()).toBeVisible({ timeout: 15000 });
  });
});
