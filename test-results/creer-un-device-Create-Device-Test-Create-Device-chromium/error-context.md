# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: creer-un-device.spec.js >> Create Device Test >> Create Device
- Location: src/generated-tests/creer-un-device.spec.js:4:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button.btn-create-device')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - heading "Device Speak" [level=2] [ref=e5]
    - list [ref=e6]:
      - listitem [ref=e7]:
        - link "Downloads" [ref=e8] [cursor=pointer]:
          - /url: /downloadzone
      - listitem [ref=e9]:
        - link "Login" [ref=e10] [cursor=pointer]:
          - /url: /login
  - generic [ref=e12]:
    - generic [ref=e13]:
      - paragraph [ref=e14]: "Erreur réseau : Failed to fetch"
      - generic [ref=e15]:
        - paragraph [ref=e16]: "Email:"
        - textbox "Entrer email" [ref=e17]: saddi.ilyes1@gmail.com
        - paragraph [ref=e18]: "Password:"
        - textbox "Entrer mot de passe" [ref=e19]: ilyes2003
        - generic [ref=e20]:
          - button "Log in" [active] [ref=e21] [cursor=pointer]
          - button "Switch to Sign up" [ref=e22] [cursor=pointer]
    - paragraph [ref=e23]:
      - link "Forgot password?" [ref=e24] [cursor=pointer]:
        - /url: /forgot-password
  - contentinfo [ref=e25]:
    - generic [ref=e26]:
      - heading "Device Speak" [level=3] [ref=e27]
      - paragraph [ref=e28]: © 2025 All rights reserved.
    - generic [ref=e29]:
      - paragraph [ref=e30]:
        - text: "Email:"
        - link "support@devicespeak.com" [ref=e31] [cursor=pointer]:
          - /url: mailto:support@devicespeak.com
      - paragraph [ref=e32]:
        - text: "Phone:"
        - link "+216 55 555 555" [ref=e33] [cursor=pointer]:
          - /url: tel:+21655555555
    - generic [ref=e34]:
      - paragraph [ref=e35]: "Follow us on social media:"
      - list "Social media links" [ref=e36]:
        - listitem [ref=e37]:
          - link "Facebook" [ref=e38] [cursor=pointer]:
            - /url: https://facebook.com/devicespeak
        - listitem [ref=e39]:
          - link "Twitter" [ref=e40] [cursor=pointer]:
            - /url: https://twitter.com/devicespeak
        - listitem [ref=e41]:
          - link "Instagram" [ref=e42] [cursor=pointer]:
            - /url: https://instagram.com/devicespeak
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Create Device Test', () => {
  4  |   test('Create Device', async ({ page }) => {
  5  |     await page.goto('http://localhost:5173/login');
  6  |     await page.fill('input[placeholder="Entrer email"]','saddi.ilyes1@gmail.com');
  7  |     await page.fill('input[placeholder="Entrer mot de passe"]', 'ilyes2003');
  8  |     await page.click('button.login-btn');
  9  |     await page.waitForLoadState('networkidle'); // wait for navigation to complete
  10 | 
> 11 |     await page.click('button.btn-create-device');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  12 |     await page.waitForSelector('input[name="name"]');
  13 | 
  14 |     await page.fill('input[name="name"]', 'Device-' + Date.now());
  15 |     await page.fill('input[name="firmware_version"]', '1.0.0');
  16 | 
  17 |     await page.waitForSelector('select[name="company_name"]');
  18 |     await page.waitForSelector('select[name="company_name"]', { state: 'attached' });
  19 |     await page.selectOption('select[name="company_name"]', { index: 0 });
  20 | 
  21 |     await page.click('button.btn:has-text("Confirm")');
  22 |     await expect(page.locator('input[name="name"]')).toBeHidden();
  23 |   });
  24 | });
```