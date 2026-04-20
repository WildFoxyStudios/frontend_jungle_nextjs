import { test, expect } from "@playwright/test";

test.describe("Auth flow", () => {
  test("register with email lands in onboarding or feed", async ({ page }) => {
    await page.goto("/register");

    // Page has the expected form
    await expect(page.getByRole("heading")).toBeVisible();

    const timestamp = Date.now();
    const username = `testuser${timestamp}`;
    const email = `test${timestamp}@example.com`;

    await page.fill('[name="username"]', username);
    await page.fill('[name="email"]', email);
    await page.fill('[name="password"]', "password123");
    await page.fill('[name="first_name"]', "Test");
    await page.fill('[name="last_name"]', "User");

    await page.click('button[type="submit"]');

    // Should redirect to onboarding or feed
    await expect(page).toHaveURL(/\/(onboarding|feed)/, { timeout: 10_000 });

    // Access token must be persisted (cookie or localStorage)
    const token = await page.evaluate(() =>
      localStorage.getItem("access_token") ?? document.cookie.includes("access_token"),
    );
    expect(token).toBeTruthy();
  });

  test("login with valid credentials redirects to feed", async ({ page }) => {
    const email = process.env["E2E_USER_EMAIL"];
    const password = process.env["E2E_USER_PASSWORD"];
    test.skip(!email || !password, "E2E_USER_EMAIL/PASSWORD not set");

    await page.goto("/login");
    await page.fill('[name="identifier"]', email!);
    await page.fill('[name="password"]', password!);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/feed", { timeout: 10_000 });
    await expect(page.locator("textarea").first()).toBeVisible();
  });

  test("login with wrong password shows error", async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="identifier"]', "definitely-not-real@nowhere.test");
    await page.fill('[name="password"]', "wrong-password");
    await page.click('button[type="submit"]');

    // Stays on /login
    await expect(page).toHaveURL(/\/login/);
    // And surfaces an error message
    await expect(page.getByText(/invalid|incorrect|failed|wrong/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test("register rejects weak password", async ({ page }) => {
    await page.goto("/register");
    await page.fill('[name="username"]', `weak${Date.now()}`);
    await page.fill('[name="email"]', `weak${Date.now()}@example.com`);
    await page.fill('[name="password"]', "123");
    await page.fill('[name="first_name"]', "Test");
    await page.fill('[name="last_name"]', "User");
    await page.click('button[type="submit"]');

    // Form should not submit — URL stays on /register or displays validation
    await expect(page).toHaveURL(/\/register/);
  });

  test("logout clears the session", async ({ page, context }) => {
    const email = process.env["E2E_USER_EMAIL"];
    const password = process.env["E2E_USER_PASSWORD"];
    test.skip(!email || !password, "E2E_USER_EMAIL/PASSWORD not set");

    await page.goto("/login");
    await page.fill('[name="identifier"]', email!);
    await page.fill('[name="password"]', password!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/feed");

    // Find a logout control (avatar dropdown etc.)
    await page.goto("/settings/account");
    const logout = page.getByRole("button", { name: /log ?out|sign ?out/i }).first();
    if (await logout.isVisible()) {
      await logout.click();
      await expect(page).toHaveURL(/\/(login|\/)/, { timeout: 5_000 });
    }

    // After logout, accessing /feed must bounce to /login
    await page.goto("/feed");
    await expect(page).toHaveURL(/\/login/);

    // Cookie should be cleared
    const cookies = await context.cookies();
    const accessCookie = cookies.find((c) => c.name === "access_token");
    expect(accessCookie?.value ?? "").toBeFalsy();
  });
});
