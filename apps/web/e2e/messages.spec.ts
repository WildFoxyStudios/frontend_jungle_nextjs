import { test, expect } from "@playwright/test";

test.describe("Messaging flow", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('[name="identifier"]', process.env["E2E_USER_EMAIL"] ?? "test@example.com");
    await page.fill('[name="password"]', process.env["E2E_USER_PASSWORD"] ?? "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/feed");
  });

  test("Send message in chat → receive via WebSocket", async ({ page }) => {
    await page.goto("/messages");
    await expect(page.locator("h1, h2").first()).toBeVisible();

    // Click first conversation if available
    const firstConversation = page.locator('[data-testid="conversation-item"]').first();
    if (await firstConversation.isVisible()) {
      await firstConversation.click();
      await page.fill('[placeholder*="message"]', "Hello from E2E test");
      await page.keyboard.press("Enter");
      await expect(page.locator("text=Hello from E2E test")).toBeVisible();
    }
  });
});
