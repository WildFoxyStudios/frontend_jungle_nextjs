import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";

/**
 * Two-session chat realtime test.
 *
 * Validates DoD §11.3 of the migration plan:
 *  - User A sends a message, user B receives it via WebSocket without a manual reload.
 *  - User A updates their avatar; user B sees the new avatar across the active session.
 *
 * Both flows require a running backend with realtime-service connected to NATS,
 * and two existing users referenced by E2E_USER_*_EMAIL/PASSWORD env vars.
 *
 * The test is skipped when the credentials aren't provided so CI keeps green
 * on contributors who don't have access to the shared seed data.
 */

interface Credentials {
  email: string;
  password: string;
}

function readCreds(prefix: "USER_A" | "USER_B"): Credentials | null {
  const email = process.env[`E2E_${prefix}_EMAIL`];
  const password = process.env[`E2E_${prefix}_PASSWORD`];
  if (!email || !password) return null;
  return { email, password };
}

async function login(page: Page, creds: Credentials): Promise<void> {
  await page.goto("/login");
  await page.fill('[name="identifier"]', creds.email);
  await page.fill('[name="password"]', creds.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(feed|onboarding)/, { timeout: 10_000 });
}

async function openConversationWith(page: Page, otherEmailFragment: string): Promise<void> {
  await page.goto("/messages");
  const item = page.locator('[data-testid="conversation-item"]', { hasText: otherEmailFragment }).first();
  if (await item.isVisible()) {
    await item.click();
    return;
  }
  // Fallback: click first conversation.
  await page.locator('[data-testid="conversation-item"]').first().click();
}

test.describe("Chat — smoke", () => {
  test("messages route loads when logged in", async ({ page }) => {
    const creds = readCreds("USER_A");
    test.skip(!creds, "E2E_USER_A_* env vars are not set");
    if (!creds) return;

    await login(page, creds);
    await page.goto("/messages");
    await expect(page).toHaveURL(/\/messages/);
  });

  test("login → messages → thread search UI", async ({ page }) => {
    const creds = readCreds("USER_A");
    test.skip(!creds, "E2E_USER_A_* env vars are not set");
    if (!creds) return;

    await login(page, creds);
    await page.goto("/messages");
    await page.locator('[data-testid="conversation-item"]').first().click();
    await page.getByTestId("chat-thread-search-toggle").click();
    const threadSearch = page.getByTestId("thread-search-input");
    await threadSearch.fill("e2e");
    await expect(threadSearch).toHaveValue("e2e");
  });
});

test.describe("Chat realtime — 2 sessions", () => {
  let browserA: BrowserContext;
  let browserB: BrowserContext;
  let pageA: Page;
  let pageB: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    browserA = await browser.newContext();
    browserB = await browser.newContext();
    pageA = await browserA.newPage();
    pageB = await browserB.newPage();
  });

  test.afterAll(async () => {
    await browserA.close();
    await browserB.close();
  });

  test("A sends a message → B receives it via WS without reload", async () => {
    const credsA = readCreds("USER_A");
    const credsB = readCreds("USER_B");
    test.skip(!credsA || !credsB, "E2E_USER_A_*/E2E_USER_B_* env vars are not set");
    if (!credsA || !credsB) return;

    await login(pageA, credsA);
    await login(pageB, credsB);

    await openConversationWith(pageA, credsB.email.split("@")[0] ?? "");
    await openConversationWith(pageB, credsA.email.split("@")[0] ?? "");

    const stamp = `e2e-${Date.now()}`;
    await pageA.fill('[placeholder*="message" i]', stamp);
    await pageA.keyboard.press("Enter");

    await expect(pageB.getByText(stamp)).toBeVisible({ timeout: 10_000 });
  });

  test("A updates avatar → B sees the new avatar without reload", async () => {
    const credsA = readCreds("USER_A");
    const credsB = readCreds("USER_B");
    const avatarFile = process.env["E2E_AVATAR_FIXTURE"];
    test.skip(
      !credsA || !credsB || !avatarFile,
      "E2E_USER_A_* / E2E_USER_B_* / E2E_AVATAR_FIXTURE env vars are required",
    );
    if (!credsA || !credsB || !avatarFile) return;

    if (!pageA.url().includes("/feed") && !pageA.url().includes("/messages")) {
      await login(pageA, credsA);
    }
    if (!pageB.url().includes("/feed") && !pageB.url().includes("/messages")) {
      await login(pageB, credsB);
    }

    await openConversationWith(pageB, credsA.email.split("@")[0] ?? "");
    const avatarInChat = pageB.locator('img[alt*="avatar" i], [data-testid="chat-avatar"]').first();
    const initialSrc = (await avatarInChat.getAttribute("src")) ?? "";

    await pageA.goto("/settings/profile");
    const fileInput = pageA.locator('input[type="file"]').first();
    await fileInput.setInputFiles(avatarFile);
    const saveBtn = pageA.getByRole("button", { name: /save|upload|change/i }).first();
    if (await saveBtn.isVisible()) await saveBtn.click();

    await expect
      .poll(
        async () => {
          const src = (await avatarInChat.getAttribute("src")) ?? "";
          return src && src !== initialSrc ? "changed" : "same";
        },
        { timeout: 15_000 },
      )
      .toBe("changed");
  });
});
