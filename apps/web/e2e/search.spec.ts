import { test, expect, type Page } from "@playwright/test";

/** Matches `GlobalKeyboardShortcuts`: Cmd on macOS, Ctrl elsewhere. */
async function pressFocusSearch(page: Page) {
  const mod = process.platform === "darwin" ? "Meta" : "Control";
  await page.keyboard.press(`${mod}+KeyK`);
}

test.describe("Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="identifier"]', "testuser@example.com");
    await page.fill('[name="password"]', "Test1234!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/feed");
  });

  test("search from header", async ({ page }) => {
    await page.fill("#global-search", "test");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/search\?q=test/);
  });

  test("search results page renders", async ({ page }) => {
    await page.goto("/search?q=hello");
    await expect(page.locator("main")).toBeVisible();
  });

  test("search with empty query stays on page", async ({ page }) => {
    await page.goto("/feed");
    await page.fill("#global-search", "   ");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL("/feed");
  });

  test("keyboard: Ctrl/Cmd+K focuses global search (desktop)", async ({ page }) => {
    await page.goto("/feed");
    await page.locator("main").click();
    await pressFocusSearch(page);
    await expect(page.locator("#global-search")).toBeFocused();
  });

  test("keyboard: Ctrl/Cmd+K expands and focuses search (mobile)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/feed");
    await expect(page.locator("#global-search")).toHaveCount(0);
    await pressFocusSearch(page);
    await expect(page.locator("#global-search")).toBeFocused({ timeout: 5000 });
  });

  test("/search loads with user filter query params in URL (uf + gender)", async ({ page }) => {
    await page.goto("/search?q=testquery&uf=1&gender=male&age_min=25&age_max=40");
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page).toHaveURL(/gender=male/);
    await expect(page).toHaveURL(/uf=1/);
    await expect(page).toHaveURL(/age_min=25/);
    await expect(page).toHaveURL(/age_max=40/);
  });

  test("search user filters reset clears uf from URL", async ({ page }) => {
    await page.goto("/search?q=testquery&uf=1&gender=male");
    await page.getByTestId("search-user-filters-trigger").click();
    await page.getByTestId("search-user-filters-reset").click();
    await page.waitForURL((url) => !url.toString().includes("uf=1"));
  });
});

test.describe("Professional search (linkedin)", () => {
  test("URL preserves profile filter params (uf + gender)", async ({ page }) => {
    await page.goto("/search/linkedin?q=devlink&uf=1&gender=female");
    await expect(page.getByTestId("linkedin-profile-filters-card")).toBeVisible();
    await expect(page).toHaveURL(/gender=female/);
    await expect(page).toHaveURL(/uf=1/);
  });
});
