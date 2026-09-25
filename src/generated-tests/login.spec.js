import { test, expect } from '@playwright/test';

test.describe('Login Test', () => {
  test('Successful login', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.fill('input[placeholder="Entrer email"]','saddi.ilyes1@gmail.com');
    await page.fill('input[placeholder="Entrer mot de passe"]', 'ilyes2003');
    await page.click('button.login-btn');
    await page.waitForURL('**/'); 
    await expect(page.locator('body')).toHaveText('Welcome back', { timeout: 5000 });
  });
});