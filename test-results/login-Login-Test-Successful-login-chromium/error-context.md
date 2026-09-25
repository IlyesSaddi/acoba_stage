# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login.spec.js >> Login Test >> Successful login
- Location: src/generated-tests/login.spec.js:4:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
Call log:
  - navigating to "http://localhost:5173/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Login Test', () => {
  4  |   test('Successful login', async ({ page }) => {
> 5  |     await page.goto('http://localhost:5173');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
  6  |     await page.fill('input[placeholder="Entrer email"]','saddi.ilyes1@gmail.com');
  7  |     await page.fill('input[placeholder="Entrer mot de passe"]', 'ilyes2003');
  8  |     await page.click('button.login-btn');
  9  |     await page.waitForURL('**/'); 
  10 |     await expect(page.locator('body')).toHaveText('Welcome back', { timeout: 5000 });
  11 |   });
  12 | });
```