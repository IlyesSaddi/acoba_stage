import { test, expect } from '@playwright/test';

test.describe('Create Device Test', () => {
  test('Create Device', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder="Entrer email"]','saddi.ilyes1@gmail.com');
    await page.fill('input[placeholder="Entrer mot de passe"]', 'ilyes2003');
    await page.click('button.login-btn');
    await page.waitForLoadState('networkidle'); // wait for navigation to complete

    await page.click('button.btn-create-device');
    await page.waitForSelector('input[name="name"]');

    await page.fill('input[name="name"]', 'Device-' + Date.now());
    await page.fill('input[name="firmware_version"]', '1.0.0');

    await page.waitForSelector('select[name="company_name"]');
    await page.waitForSelector('select[name="company_name"]', { state: 'attached' });
    await page.selectOption('select[name="company_name"]', { index: 0 });

    await page.click('button.btn:has-text("Confirm")');
    await expect(page.locator('input[name="name"]')).toBeHidden();
  });
});