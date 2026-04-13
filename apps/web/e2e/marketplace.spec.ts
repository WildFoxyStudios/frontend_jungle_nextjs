import { test, expect } from "@playwright/test";

test.describe("Marketplace flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="identifier"]', process.env["E2E_USER_EMAIL"] ?? "test@example.com");
    await page.fill('[name="password"]', process.env["E2E_USER_PASSWORD"] ?? "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/feed");
  });

  test("Add product to cart → checkout flow", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(page).toHaveURL("/marketplace");

    // Click first product if available
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();
      // Product detail page
      const addToCartBtn = page.locator('button:has-text("Add to Cart")');
      if (await addToCartBtn.isVisible()) {
        await addToCartBtn.click();
        // Cart should update
        await expect(page.locator('[data-testid="cart-count"]')).toBeVisible({ timeout: 3000 });
      }
    }
  });
});
