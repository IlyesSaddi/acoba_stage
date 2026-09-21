import { test, expect } from '@playwright/test';

test.describe('should create a company successfully', () => {
  test('create company', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder="Entrer email"]','saddi.ilyes1@gmail.com');
    await page.fill('input[placeholder="Entrer mot de passe"]', 'ilyes2003');
    await page.click('button.login-btn');
    await page.waitForURL('**/');

    await page.goto('http://localhost:5173/company');
    await page.waitForSelector('input[placeholder="Nom de la compagnie"]');

    await page.fill('input[placeholder="Nom de la compagnie"]', 'Acoba-' + Date.now());
    await page.fill('input[placeholder="Description"]', 'Description Acoba Test');

    await page.click('button.btn-create-device');
    await page.waitForSelector('input[placeholder="Nom de la compagnie"]');

    await page.fill('input[placeholder="Nom de la compagnie"]', 'Acoba-' + Date.now());
    await page.fill('input[placeholder="Description"]', 'Description Acoba Test');

    await page.click('button.btn:has-text("Confirm")');
    await page.waitForSelector('.company-manager__list');

    await expect(page.locator('.company-manager__list')).toContainText('Acoba-');
  });
});