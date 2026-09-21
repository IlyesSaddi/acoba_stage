import { test, expect } from '@playwright/test';

test.describe('User creation test', () => {
  test('Create a new user', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.click('button.signup-btn');
    await page.fill('input[placeholder="Entrer email"]', 'user_' + Date.now() + '@example.com');
    await page.fill('input[placeholder="Entrer mot de passe"]', 'password123');
    await page.click('button.login-btn');
    await expect(page.locator('p.success-message')).toContainText('Compte créé avec succès');
  });

  test('Existing email error', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.click('button.signup-btn');
    await page.fill('input[placeholder="Entrer email"]', 'existing@example.com');
    await page.fill('input[placeholder="Entrer mot de passe"]', 'password123');
    await page.click('button.login-btn');
    await expect(page.locator('p.error-message')).toContainText('User already exists');
  });

  test('Resend confirmation email', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.click('button.signup-btn');
    await page.fill('input[placeholder="Entrer email"]', 'user_' + Date.now() + '@example.com');
    await page.fill('input[placeholder="Entrer mot de passe"]', 'password123');
    await page.click('button.login-btn');
    await page.waitForTimeout(5000); // wait for the confirmation email to be sent
    await expect(page.locator('p.error-message')).toContainText('confirmer votre compte');
    await page.click('button:text("Renvoyer email")');
  });
});