import { test, expect } from '@playwright/test';

test.describe('Dashboard access control', () => {
  test('unauthenticated user cannot open schools list', async ({ page }) => {
    await page.goto('/admin/schools');
    await expect(page).toHaveURL(/login/);
  });

  test('super-admin route requires auth', async ({ page }) => {
    await page.goto('/super-admin');
    await expect(page).toHaveURL(/login/);
  });
});
