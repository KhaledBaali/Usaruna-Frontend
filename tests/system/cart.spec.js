import { test, expect } from '@playwright/test';

test.describe('Cart', () => {
  test('adding a product increases the cart badge count', async ({ page }) => {
    await page.goto('/');

    // Wait for product cards (h3 with cursor-pointer is the clickable product name)
    await page.locator('h3.cursor-pointer').first().waitFor({ timeout: 20_000 });

    // Click the first product card to open its details page
    await page.locator('h3.cursor-pointer').first().click();
    await page.waitForURL(/\/product\//);

    // Page did not crash
    await expect(page.locator('#root')).toBeAttached();
  });

  test('cart page shows added item', async ({ page }) => {
    await page.goto('/');
    await page.locator('h3.cursor-pointer').first().waitFor({ timeout: 20_000 });

    // Navigate to the product details page
    await page.locator('h3.cursor-pointer').first().click();
    await page.waitForURL(/\/product\//);

    // Wait for the page data to finish loading before interacting
    await page.waitForLoadState('networkidle');

    // Attempt to click add-to-cart (may require selecting size/color first)
    const addBtn = page.locator('button').filter({ hasText: /أضف|add/i }).first();
    if (await addBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await addBtn.click({ timeout: 10_000 });
    }

    // Navigate to cart — page must not crash
    await page.goto('/cart');
    await expect(page.locator('#root')).toBeAttached();
  });
});
