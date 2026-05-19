import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    // The login form should have an email/phone input
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('register page loads', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('cart page loads when empty', async ({ page }) => {
    await page.goto('/cart');
    // Should not crash — page renders something
    await expect(page.locator('body')).toBeVisible();
  });

  test('forgot-password page loads', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('unknown route does not crash the app', async ({ page }) => {
    // SPA — all unknown paths serve index.html; React router renders empty Routes
    const res = await page.goto('/this-does-not-exist');
    expect(res.status()).not.toBe(500);
    // The React root must mount (no white-screen crash)
    await expect(page.locator('#root')).toBeAttached();
  });
});
