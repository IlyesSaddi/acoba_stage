module.exports = {
  keywords: [
    "supprimer entreprise", "supprimer une entreprise", "delete company", "remove company",
    "effacer entreprise", "supprimer company", "supprimer une company", "supprimer societe",
    "supprimer une societe", "effacer societe"
  ],

   name: "Supprimer une entreprise",
  steps: [
    { id: "login", name: "Connexion", action: "await page.goto('http://localhost:5173/login'); await page.fill('input[placeholder=\"Entrer email\"]', 'saddi.ilyes1@gmail.com'); await page.fill('input[placeholder=\"Entrer mot de passe\"]', 'ilyes2003'); await page.click('button.login-btn'); await page.waitForURL('**/')" },
    { id: "navigate_company", name: "Navigation vers la page Entreprise", action: "await page.goto('http://localhost:5173/company'); await page.waitForSelector('.company-manager__list')" },
    { id: "handle_dialog", name: "Gérer la boîte de dialogue de confirmation", action: "page.on('dialog', dialog => dialog.accept())" },
    { id: "click_delete", name: "Cliquer sur le bouton Supprimer", action: "await page.click('button.company-manager__delete-button')" }
  ],
  resolverFile: "Companies.js",

  functions: {
    main: [
      { functionName: "deleteCompany", role: "MAIN WORKFLOW", reason: "Main backend operation responsible for deleting a company." }
    ],
    postCreation: [],
    alternative: [],
    unrelated: [
      { functionName: "createCompany", role: "UNRELATED", reason: "Creation operation, not required for deleting a company." }
    ]
  },

  supporting: [
    { file: "models/Company.js", role: "SUPPORTING CODE", reason: "Mongoose Company model used by deleteCompany." },
    { file: "graphql/schema/index.js", role: "SUPPORTING CODE", reason: "GraphQL schema defining the deleteCompany mutation." },
    { file: "frontend/company.jsx", role: "SUPPORTING CODE", reason: "Frontend component containing the delete company action." }
  ],

  workflow: `
AUTHENTICATION PREREQUISITE & NAVIGATION

This page requires the user to be logged in and navigate to /company.
The test MUST login first before accessing the company page.

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

2. Navigate to Company Page:
   await page.goto('http://localhost:5173/company');
   await page.waitForSelector('.company-manager__list');

3. Handle Confirmation Dialog (window.confirm):
   page.on('dialog', dialog => dialog.accept());

4. Click Delete Button on the target company:
   await page.click('button.company-manager__delete-button');

IMPORTANT:
- Generate ONLY 1 clean, passing test suite.
`
};

