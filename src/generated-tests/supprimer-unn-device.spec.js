import { test, expect } from '@playwright/test';

test.describe('Delete Device Test', () => {
  test('should delete a device by name', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder="Entrer email"]','saddi.ilyes1@gmail.com');
    await page.fill('input[placeholder="Entrer mot de passe"]', 'ilyes2003');
    await page.click('button.login-btn');
    await page.waitForURL('**/');

    await page.goto('http://localhost:5173/');
    await page.waitForSelector('input.delete-device-input');

    page.on('dialog', dialog => dialog.accept());

    await page.fill('input.delete-device-input', 'Device-1789658022300');
    await page.click('button.delete-device-button');

    await expect(page.getByRole('heading', { name: 'Device-1789658022300', exact: true })).toBeHidden();
  });
});