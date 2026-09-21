module.exports = {
  keywords: [
    "modifier device", "modifier un device", "update device", "edit device",
    "mettre a jour device", "modifier appareil", "update appareil", "editer device",
    "editer un device", "mettre a jour un device"
  ],

   name: "Modifier un device",
  steps: [
    { id: "login", name: "Connexion", action: "await page.goto('http://localhost:5173/login'); await page.fill('input[placeholder=\"Entrer email\"]', 'saddi.ilyes1@gmail.com'); await page.fill('input[placeholder=\"Entrer mot de passe\"]', 'ilyes2003'); await page.click('button.login-btn'); await page.waitForURL('**/')" },
    { id: "navigate_home", name: "Navigation vers la page d'accueil", action: "await page.goto('http://localhost:5173/'); await page.waitForSelector('form.update-device-form')" },
    { id: "listen_dialog", name: "Écouter l'alerte de succès", action: "page.on('dialog', dialog => dialog.accept())" },
    { id: "select_device", name: "Sélectionner un device", action: "await page.waitForSelector('form.update-device-form select', { state: 'attached' }); await page.selectOption('form.update-device-form select', { index: 0 })" },
    { id: "fill_name", name: "Remplir le nouveau nom", action: "await page.fill('input[placeholder=\"Nouvelle nom\"]', 'Device-Updated-' + Date.now())" },
    { id: "submit", name: "Soumettre le formulaire", action: "await page.click('form.update-device-form button[type=\"submit\"]')" }
  ],
  resolverFile: "Devices.js",

  functions: {
    main: [
      { functionName: "updateDevice", role: "MAIN WORKFLOW", reason: "Main backend operation responsible for updating a device's information." }
    ],
    postCreation: [],
    alternative: [],
    unrelated: [
      { functionName: "createDevice", role: "UNRELATED", reason: "Creation operation, not required for updating a device." },
      { functionName: "deleteDeviceByName", role: "UNRELATED", reason: "Deletion operation, not required for updating a device." }
    ]
  },

  supporting: [
    { file: "models/Device.js", role: "SUPPORTING CODE", reason: "Mongoose Device model used by updateDevice." },
    { file: "graphql/schema/index.js", role: "SUPPORTING CODE", reason: "GraphQL schema defining the updateDevice mutation." },
    { file: "frontend/updatedevice.jsx", role: "SUPPORTING CODE", reason: "Frontend component containing the device update form and mutation." }
  ],

  workflow: `
AUTHENTICATION PREREQUISITE & NAVIGATION

This page requires the user to be logged in.
The test MUST login first before accessing the main page.

Login credentials to use in tests:
  Email    : saddi.ilyes1@gmail.com
  Password : ilyes2003

EXACT PLAYWRIGHT CODE STEPS TO FOLLOW:

1. Login:
   await page.goto('http://localhost:5173/login');
   await page.fill('input[placeholder="Entrer email"]', 'saddi.ilyes1@gmail.com');
   await page.fill('input[placeholder="Entrer mot de passe"]', 'ilyes2003');
   await page.click('button.login-btn');
   await page.waitForURL('**/');

2. Navigate to Home/Devices Page:
   await page.goto('http://localhost:5173/');
   await page.waitForSelector('form.update-device-form');

3. Listen for Success Alert dialog:
   page.on('dialog', dialog => dialog.accept());

4. Select Device from Dropdown:
   await page.waitForSelector('form.update-device-form select', { state: 'attached' });
   await page.selectOption('form.update-device-form select', { index: 0 });

5. Fill New Name or Firmware:
   await page.fill('input[placeholder="Nouvelle nom"]', 'Device-Updated-' + Date.now());

6. Submit Form:
   await page.click('form.update-device-form button[type="submit"]');

IMPORTANT:
- Generate ONLY 1 clean, passing test suite.
`
};

