import { test, expect } from '@playwright/test';

test.describe('Password Reset Request', () => {
  test('request password reset with existing email', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder="Entrer email"]','saddi.ilyes1@gmail.com');
    await page.fill('input[placeholder="Entrer mot de passe"]', 'ilyes2003');
    await page.click('button.login-btn');
    await page.waitForURL('**/');
    await page.goto('http://localhost:5173/forgot-password');
    await page.fill('input[placeholder="Your email"]','saddi.ilyes1@gmail.com');
    await page.click('button[type="submit"]');
    await expect(page.locator('form p')).toHaveText('Password reset email sent.');
  });
});