import { test, expect } from '@playwright/test';

test.describe('Admin login', () => {
  test('shows login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('redirects unauthenticated users from admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/login/);
  });
});
