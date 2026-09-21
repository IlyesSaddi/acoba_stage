import { test, expect } from '@playwright/test';

test.describe('Create Company', () => {
  test('should create a company successfully', async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder="Entrer email"]','saddi.ilyes1@gmail.com');
    await page.fill('input[placeholder="Entrer mot de passe"]', 'ilyes2003');
    await page.click('button.login-btn');
    await page.waitForURL('**/');

    // Navigate to Company Page
    await page.goto('http://localhost:5173/company');
    await page.waitForSelector('input[placeholder="Nom de la compagnie"]');

    // Fill Form
    await page.fill('input[placeholder="Nom de la compagnie"]', 'Acoba-' + Date.now());
    await page.fill('input[placeholder="Description"]', 'Description Acoba Test');

    // Submit
    await page.click('button.company-manager__button');

    // Verify
    await expect(page.locator('.company-manager__list')).toContainText('Acoba-');
  });
});