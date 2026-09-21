module.exports = {
  keywords: [
    "creer entreprise", "creer une entreprise", "create company", "nouvelle entreprise",
    "creer company", "creer un company", "creer une company",
    "nouvelle company", "creer societe", "creer une societe", "nouvelle societe"
  ],

   name: "Créer une entreprise",
  steps: [
    { id: "login", name: "Connexion", action: "await page.goto('http://localhost:5173/login'); await page.fill('input[placeholder=\"Entrer email\"]', 'saddi.ilyes1@gmail.com'); await page.fill('input[placeholder=\"Entrer mot de passe\"]', 'ilyes2003'); await page.click('button.login-btn'); await page.waitForURL('**/')" },
    { id: "navigate_company", name: "Navigation vers la page Entreprise", action: "await page.goto('http://localhost:5173/company'); await page.waitForSelector('input[placeholder=\"Nom de la compagnie\"]')" },
    { id: "fill_form", name: "Remplir le formulaire", action: "await page.fill('input[placeholder=\"Nom de la compagnie\"]', 'Acoba-' + Date.now()); await page.fill('input[placeholder=\"Description\"]', 'Description Acoba Test')" },
    { id: "submit", name: "Soumettre", action: "await page.click('button.company-manager__button')" },
    { id: "verify", name: "Vérifier la création", action: "await expect(page.locator('.company-manager__list')).toContainText('Acoba-')" }
  ],
  resolverFile: "Companies.js",

  functions: {
    main: [
      { functionName: "createCompany", role: "MAIN WORKFLOW", reason: "Main backend operation responsible for company creation." }
    ],
    postCreation: [],
    alternative: [],
    unrelated: [
      { functionName: "deleteCompany", role: "UNRELATED", reason: "Deletion operation, not required for creating a company." }
    ]
  },

  supporting: [
    { file: "models/Company.js", role: "SUPPORTING CODE", reason: "Mongoose Company model used by createCompany." },
    { file: "graphql/schema/index.js", role: "SUPPORTING CODE", reason: "GraphQL schema defining the createCompany mutation." },
    { file: "frontend/company.jsx", role: "SUPPORTING CODE", reason: "Frontend component containing the company creation form and mutation." }
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
   await page.waitForSelector('input[placeholder="Nom de la compagnie"]');

3. Fill Form:
   await page.fill('input[placeholder="Nom de la compagnie"]', 'Acoba-' + Date.now());
   await page.fill('input[placeholder="Description"]', 'Description Acoba Test');

4. Submit:
   await page.click('button.company-manager__button');

5. Verify:
   await expect(page.locator('.company-manager__list')).toContainText('Acoba-');

IMPORTANT:
- Generate ONLY 1 test block ("should create a company successfully").
- Do NOT generate secondary test cases for missing fields.
`
};

