module.exports = {
  name: "Créer un device",
  steps: [
    { id: "login", name: "Connexion", action: "await page.goto('http://localhost:5173/login'); await page.fill('input[placeholder=\"Entrer email\"]', 'saddi.ilyes1@gmail.com'); await page.fill('input[placeholder=\"Entrer mot de passe\"]', 'ilyes2003'); await page.click('button.login-btn'); await page.waitForURL('**/')" },
    { id: "open_modal", name: "Ouvrir le modal de création", action: "await page.click('button.btn-create-device'); await page.waitForSelector('input[name=\"name\"]')" },
    { id: "fill_form", name: "Remplir le formulaire", action: "await page.fill('input[name=\"name\"]', 'Device-' + Date.now()); await page.fill('input[name=\"firmware_version\"]', '1.0.0')" },
    { id: "select_company", name: "Sélectionner une entreprise", action: "await page.waitForSelector('select[name=\"company_name\"]', { state: 'attached' }); await page.selectOption('select[name=\"company_name\"]', { index: 0 })" },
    { id: "submit_verify", name: "Soumettre et vérifier", action: "await page.click('button.btn:has-text(\"Confirm\")'); await expect(page.locator('input[name=\"name\"]')).toBeHidden()" }
  ],
  keywords: ["creer device", "creer un device", "create device", "ajouter device", "ajouter un device", "nouveau device", "add device"],

  resolverFile: "Devices.js",
  functions: {
    main:         ["createDevice"],
    postCreation: [],
    alternative:  [],
    unrelated:    ["deleteDeviceByName", "updateDevice"]
  },

  supporting: [
    { file: "models/Device.js",                   role: "SUPPORTING CODE", reason: "Mongoose Device model used by createDevice." },
    { file: "graphql/schema/index.js",             role: "SUPPORTING CODE", reason: "GraphQL schema defining the createDevice mutation." },
    { file: "frontend/createdevice.jsx",           role: "SUPPORTING CODE", reason: "Frontend component containing the Create Device button and form." }
  ],

  workflow: `
AUTHENTICATION PREREQUISITE

This page requires the user to be logged in.
The test MUST login first before accessing the devices page.

Login credentials to use in tests:
  Email    : saddi.ilyes1@gmail.com
  Password : ilyes2003

Steps to authenticate:
  1. Go to http://localhost:5173/login
  2. Fill input[placeholder="Entrer email"] with saddi.ilyes1@gmail.com
  3. Fill input[placeholder="Entrer mot de passe"] with ilyes2003
  4. Click button.login-btn
  5. Wait for navigation to complete (page.waitForURL with ** glob or just waitForTimeout 1000)

VERIFIED SELECTORS (from createdevice.jsx and modal.jsx source code)

Button to open the Create Device modal:
  button.btn  — the first button.btn on the page (text: "+ Create Device")
  Located at: http://localhost:5173/ (home/devices page)

Form inputs inside the modal:
  input[name="name"]               — Device name field
  input[name="firmware_version"]   — Firmware version field
  select[name="company_name"]      — Company dropdown (options loaded dynamically from GraphQL)

IMPORTANT for the company dropdown:
  - Options are loaded asynchronously from GraphQL.
  - Do NOT select by company name — it is not known in advance.
  - Use index to select the first available option:
      await page.selectOption('select[name="company_name"]', { index: 0 });
  - Wait for the select to have options before selecting:
      await page.waitForFunction(() => document.querySelector('select[name="company_name"]').options.length > 0);

Modal action buttons (from modal.jsx):
  Cancel button : button.btn:has-text("Cancel")
  Confirm button: button.btn:has-text("Confirm")

EXACT PLAYWRIGHT CODE STEPS TO FOLLOW:

1. Login:
   await page.goto('http://localhost:5173/login');
   await page.fill('input[placeholder="Entrer email"]', 'saddi.ilyes1@gmail.com');
   await page.fill('input[placeholder="Entrer mot de passe"]', 'ilyes2003');
   await page.click('button.login-btn');
   await page.waitForURL('**/');

2. Open Modal:
   await page.click('button.btn-create-device');
   await page.waitForSelector('input[name="name"]');

3. Fill Form:
   await page.fill('input[name="name"]', 'Device-' + Date.now());
   await page.fill('input[name="firmware_version"]', '1.0.0');

4. Select Company:
   await page.waitForSelector('select[name="company_name"]', { state: 'attached' });
   await page.selectOption('select[name="company_name"]', { index: 0 });

5. Submit & Verify:
   await page.click('button.btn:has-text("Confirm")');
   await expect(page.locator('input[name="name"]')).toBeHidden();
`
};
