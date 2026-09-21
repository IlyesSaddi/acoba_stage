module.exports = {
  keywords: [
    "supprimer device", "supprimer un device", "delete device", "remove device",
    "effacer device", "supprimer appareil", "delete appareil", "effacer appareil",
    "supprimer un appareil", "retirer device", "retirer un device"
  ],

   name: "Supprimer un device",
  steps: [
    { id: "login", name: "Connexion", action: "await page.goto('http://localhost:5173/login'); await page.fill('input[placeholder=\"Entrer email\"]', 'saddi.ilyes1@gmail.com'); await page.fill('input[placeholder=\"Entrer mot de passe\"]', 'ilyes2003'); await page.click('button.login-btn'); await page.waitForURL('**/')" },
    { id: "navigate_home", name: "Navigation vers la page d'accueil", action: "await page.goto('http://localhost:5173/'); await page.waitForSelector('input.delete-device-input')" },
    { id: "setup_dialog", name: "Configurer l'écoute de la boîte de dialogue", action: "page.on('dialog', dialog => dialog.accept())" },
    { id: "fill_name", name: "Remplir le nom du device à supprimer", action: "await page.fill('input.delete-device-input', 'Device-1789658022300')" },
    { id: "click_delete", name: "Cliquer sur le bouton Supprimer", action: "await page.click('button.delete-device-button')" },
    { id: "verify_deleted", name: "Vérifier la suppression", action: "await expect(page.getByRole('heading', { name: 'Device-1789658022300', exact: true })).toBeHidden()" }
  ],
  resolverFile: "Devices.js",

  functions: {
    main: [
      { functionName: "deleteDeviceByName", role: "MAIN WORKFLOW", reason: "Main backend operation responsible for deleting a device by its name." }
    ],
    postCreation: [],
    alternative: [],
    unrelated: [
      { functionName: "createDevice", role: "UNRELATED", reason: "Creation operation, not required for deleting a device." },
      { functionName: "updateDevice", role: "UNRELATED", reason: "Update operation, not required for deleting a device." }
    ]
  },

  supporting: [
    { file: "models/Device.js", role: "SUPPORTING CODE", reason: "Mongoose Device model used by deleteDeviceByName." },
    { file: "graphql/schema/index.js", role: "SUPPORTING CODE", reason: "GraphQL schema defining the deleteDeviceByName mutation." },
    { file: "frontend/deletedevice.jsx", role: "SUPPORTING CODE", reason: "Frontend component containing the delete device action." }
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
   await page.waitForSelector('input.delete-device-input');

3. Setup Dialog Listener (window.confirm):
   page.on('dialog', dialog => dialog.accept());

4. Fill Device Name to Delete:
  await page.fill('input.delete-device-input', 'Device-1789658022300');

5. Click Delete Button:
   await page.click('button.delete-device-button');

6. Verify Deletion:
  await expect(page.getByRole('heading', { name: 'Device-1789658022300', exact: true })).toBeHidden();

IMPORTANT:
- Generate ONLY 1 clean, passing test suite.
`
};

