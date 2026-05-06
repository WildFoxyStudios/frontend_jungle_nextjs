# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: search.spec.ts >> Search >> search from header
- Location: e2e\search.spec.ts:18:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login
Call log:
  - navigating to "http://localhost:3000/login", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect, type Page } from "@playwright/test";
  2  | 
  3  | /** Matches `GlobalKeyboardShortcuts`: Cmd on macOS, Ctrl elsewhere. */
  4  | async function pressFocusSearch(page: Page) {
  5  |   const mod = process.platform === "darwin" ? "Meta" : "Control";
  6  |   await page.keyboard.press(`${mod}+KeyK`);
  7  | }
  8  | 
  9  | test.describe("Search", () => {
  10 |   test.beforeEach(async ({ page }) => {
> 11 |     await page.goto("/login");
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login
  12 |     await page.fill('[name="identifier"]', "testuser@example.com");
  13 |     await page.fill('[name="password"]', "Test1234!");
  14 |     await page.click('button[type="submit"]');
  15 |     await page.waitForURL("/feed");
  16 |   });
  17 | 
  18 |   test("search from header", async ({ page }) => {
  19 |     await page.fill("#global-search", "test");
  20 |     await page.keyboard.press("Enter");
  21 |     await expect(page).toHaveURL(/\/search\?q=test/);
  22 |   });
  23 | 
  24 |   test("search results page renders", async ({ page }) => {
  25 |     await page.goto("/search?q=hello");
  26 |     await expect(page.locator("main")).toBeVisible();
  27 |   });
  28 | 
  29 |   test("search with empty query stays on page", async ({ page }) => {
  30 |     await page.goto("/feed");
  31 |     await page.fill("#global-search", "   ");
  32 |     await page.keyboard.press("Enter");
  33 |     await expect(page).toHaveURL("/feed");
  34 |   });
  35 | 
  36 |   test("keyboard: Ctrl/Cmd+K focuses global search (desktop)", async ({ page }) => {
  37 |     await page.goto("/feed");
  38 |     await page.locator("main").click();
  39 |     await pressFocusSearch(page);
  40 |     await expect(page.locator("#global-search")).toBeFocused();
  41 |   });
  42 | 
  43 |   test("keyboard: Ctrl/Cmd+K expands and focuses search (mobile)", async ({ page }) => {
  44 |     await page.setViewportSize({ width: 375, height: 812 });
  45 |     await page.goto("/feed");
  46 |     await expect(page.locator("#global-search")).toHaveCount(0);
  47 |     await pressFocusSearch(page);
  48 |     await expect(page.locator("#global-search")).toBeFocused({ timeout: 5000 });
  49 |   });
  50 | });
  51 | 
```