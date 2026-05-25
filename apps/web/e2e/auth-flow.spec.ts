import { test, expect } from '@playwright/test';

test.describe('Auth flow', () => {
  test('login page has email and password fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('invalid login shows error or stays on login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    const submit = page.getByRole('button', { name: /sign in|log in|login/i });
    if (await submit.isVisible()) {
      await submit.click();
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/login/);
    }
  });
});
