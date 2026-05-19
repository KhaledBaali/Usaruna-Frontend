import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads and shows the brand name', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/اسرنا/);
  });

  test('navigation bar is visible', async ({ page }) => {
    await page.goto('/');
    // Logo image should render
    await expect(page.locator('img[src="/logo.webp"]').first()).toBeVisible();
  });

  test('search bar is present', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('input[type="text"], input[type="search"]').first()).toBeVisible();
  });

  test('product cards appear after loading', async ({ page }) => {
    await page.goto('/');
    // Product names render as <h3 class="...cursor-pointer..."> inside each card
    await expect(page.locator('h3.cursor-pointer').first()).toBeVisible({ timeout: 20_000 });
  });

  test('clicking a product card navigates to product details', async ({ page }) => {
    await page.goto('/');
    const firstCard = page.locator('h3.cursor-pointer').first();
    await firstCard.waitFor({ timeout: 20_000 });
    await firstCard.click();
    await expect(page).toHaveURL(/\/product\//);
  });
});
