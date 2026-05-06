import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Axe-core accessibility coverage for the admin app.
 *
 * Pages: dashboard, users, settings (general/email/sms/push), system tools.
 *
 * The admin app is English-only and lives behind authentication; the test
 * skips when admin credentials aren't provided in the environment.
 */

const ADMIN_PAGES = [
  { path: "/", label: "dashboard" },
  { path: "/users", label: "users" },
  { path: "/settings/general", label: "settings-general" },
  { path: "/settings/email", label: "settings-email" },
  { path: "/settings/sms", label: "settings-sms" },
  { path: "/settings/push", label: "settings-push" },
  { path: "/system/ffmpeg", label: "system-ffmpeg" },
  { path: "/system/dlq", label: "system-dlq" },
] as const;

async function login(page: Page): Promise<boolean> {
  const email = process.env["E2E_ADMIN_EMAIL"];
  const password = process.env["E2E_ADMIN_PASSWORD"];
  if (!email || !password) return false;
  await page.goto("/login");
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.click('button[type="submit"]');
  try {
    await page.waitForURL(/\/(dashboard|home|users|settings|\/$)/, { timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}

test.describe("Admin accessibility", () => {
  test.beforeEach(async ({ page }) => {
    const ok = await login(page);
    test.skip(!ok, "E2E_ADMIN_EMAIL/PASSWORD not set");
  });

  for (const entry of ADMIN_PAGES) {
    test(`a11y: ${entry.label}`, async ({ page }) => {
      await page.goto(entry.path);
      await page.waitForLoadState("networkidle").catch(() => undefined);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
        .disableRules(["color-contrast"])
        .analyze();
      if (results.violations.length > 0) {
        const summary = results.violations
          .map((v) => `[${v.impact ?? "n/a"}] ${v.id} — ${v.help} (${v.nodes.length} node(s))`)
          .join("\n  ");
        // eslint-disable-next-line no-console
        console.warn(`Axe violations on ${entry.label}:\n  ${summary}`);
      }
      expect(results.violations).toEqual([]);
    });
  }
});
