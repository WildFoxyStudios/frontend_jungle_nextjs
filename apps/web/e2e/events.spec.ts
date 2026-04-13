import { test, expect } from "@playwright/test";

test.describe("Events", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="identifier"]', "testuser@example.com");
    await page.fill('[name="password"]', "Test1234!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/feed");
  });

  test("navigate to events page", async ({ page }) => {
    await page.goto("/events");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("create a new event", async ({ page }) => {
    await page.goto("/events/create");
    await page.fill('[name="title"]', "E2E Test Event");
    await page.fill('[name="start_date"]', "2025-12-01");
    await page.fill('[name="end_date"]', "2025-12-02");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/events\/.+/);
  });

  test("RSVP to event", async ({ page }) => {
    await page.goto("/events");
    await page.locator("a[href*='/events/']").first().click();
    const goingBtn = page.getByRole("button", { name: /going|interested/i });
    if (await goingBtn.isVisible()) {
      await goingBtn.click();
    }
  });
});
