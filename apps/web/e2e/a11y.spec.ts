import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Axe-core accessibility coverage for the critical pages of the web app.
 *
 * Pages covered (per migration plan §D4): home, feed, profile, chat,
 * post detail, settings, checkout, and a public landing page.
 *
 * Strategy:
 *  - Tag the audit with WCAG 2.1 AA + best-practice rules.
 *  - Disable color-contrast for now (the design system is still iterating
 *    on dark-mode tokens) — we re-enable it in the global verification step
 *    once the contrast tokens stabilize.
 *  - For authenticated pages, log in if E2E_USER_EMAIL is set; otherwise
 *    skip so contributors without seed data still get a green report.
 */

const AUTH_PAGES = [
  { path: "/feed", label: "feed" },
  { path: "/messages", label: "chat" },
  { path: "/settings/profile", label: "settings-profile" },
  { path: "/settings/notifications", label: "settings-notifications" },
  { path: "/settings/account", label: "settings-account" },
] as const;

const PUBLIC_PAGES = [
  { path: "/", label: "landing" },
  { path: "/login", label: "login" },
  { path: "/register", label: "register" },
] as const;

async function login(page: Page): Promise<boolean> {
  const email = process.env["E2E_USER_EMAIL"];
  const password = process.env["E2E_USER_PASSWORD"];
  if (!email || !password) return false;
  await page.goto("/login");
  await page.fill('[name="identifier"]', email);
  await page.fill('[name="password"]', password);
  await page.click('button[type="submit"]');
  try {
    await page.waitForURL(/\/(feed|onboarding)/, { timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}

async function runAxe(page: Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
    .disableRules(["color-contrast"])
    .analyze();

  if (results.violations.length > 0) {
    const summary = results.violations
      .map((v) => `[${v.impact ?? "n/a"}] ${v.id} — ${v.help} (${v.nodes.length} node(s))`)
      .join("\n  ");
    // eslint-disable-next-line no-console
    console.warn(`Axe violations on ${label}:\n  ${summary}`);
  }
  expect(results.violations).toEqual([]);
}

test.describe("Accessibility — public pages", () => {
  for (const entry of PUBLIC_PAGES) {
    test(`a11y: ${entry.label}`, async ({ page }) => {
      await page.goto(entry.path);
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await runAxe(page, entry.label);
    });
  }
});

test.describe("Accessibility — authenticated pages", () => {
  test.beforeEach(async ({ page }) => {
    const ok = await login(page);
    test.skip(!ok, "E2E_USER_EMAIL/PASSWORD not set; skipping auth a11y suite");
  });

  for (const entry of AUTH_PAGES) {
    test(`a11y: ${entry.label}`, async ({ page }) => {
      await page.goto(entry.path);
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await runAxe(page, entry.label);
    });
  }

  test("a11y: post detail (first feed item)", async ({ page }) => {
    await page.goto("/feed");
    await page.waitForLoadState("networkidle").catch(() => undefined);
    const firstPostLink = page.locator('a[href^="/posts/"], a[href^="/p/"]').first();
    if (await firstPostLink.isVisible()) {
      await firstPostLink.click();
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await runAxe(page, "post-detail");
    } else {
      test.skip(true, "No posts available in feed for this account");
    }
  });

  test("a11y: marketplace + checkout", async ({ page }) => {
    await page.goto("/marketplace");
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await runAxe(page, "marketplace");

    await page.goto("/checkout");
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await runAxe(page, "checkout");
  });
});
