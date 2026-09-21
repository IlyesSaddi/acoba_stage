module.exports = {
  keywords: [
    "ajouter entreprise utilisateur", "ajouter entreprise a utilisateur", "ajouter entreprise a un utilisateur",
    "ajouter une entreprise a un utilisateur", "ajouter une entreprise a utilisateur", "add company to user",
    "associer entreprise", "lier entreprise", "addcompanytouser", "associer une societe",
    "ajouter societe a un utilisateur", "ajouter societe a utilisateur", "associer societe",
    "ajouter entreprise a un utilisateur", "lier une entreprise a un utilisateur", "associer company",
    "associer une entreprise a un utilisateur", "associer une entreprise"
  ],

   name: "Ajouter une entreprise à un utilisateur",
  steps: [
    { id: "login", name: "Connexion", action: "await page.goto('http://localhost:5173/login'); await page.fill('input[placeholder=\"Entrer email\"]', 'saddi.ilyes1@gmail.com'); await page.fill('input[placeholder=\"Entrer mot de passe\"]', 'ilyes2003'); await page.click('button.login-btn'); await page.waitForURL('**/')" },
    { id: "navigate_company", name: "Navigation vers la page Entreprise", action: "await page.goto('http://localhost:5173/company'); await page.waitForSelector('.add-company-container')" },
    { id: "select_user", name: "Sélectionner un utilisateur", action: "await page.waitForSelector('.add-company-container select', { state: 'attached' }); await page.selectOption('.add-company-container select', { index: 1 })" },
    { id: "select_company", name: "Sélectionner une entreprise", action: "await page.waitForSelector('.add-company-container select.form-select', { state: 'attached' }); await page.selectOption('.add-company-container select.form-select', { index: 1 })" },
    { id: "submit", name: "Soumettre l'association", action: "await page.click('button.btn-submit')" },
    { id: "verify", name: "Vérifier le succès", action: "await expect(page.locator('.add-company-container')).toContainText('Société associée avec succès')" }
  ],
  resolverFile: "companytouser.js",

  functions: {
    main: [
      { functionName: "addCompanyToUser", role: "MAIN WORKFLOW", reason: "Main backend operation responsible for associating a company with a user." }
    ],
    postCreation: [],
    alternative: [],
    unrelated: [
      { functionName: "removeCompanyFromUser", role: "UNRELATED", reason: "Removal operation — the inverse of this scenario." }
    ]
  },

  supporting: [
    { file: "models/User.js", role: "SUPPORTING CODE", reason: "Mongoose User model updated when a company is added." },
    { file: "models/Company.js", role: "SUPPORTING CODE", reason: "Mongoose Company model referenced in the association." },
    { file: "graphql/schema/index.js", role: "SUPPORTING CODE", reason: "GraphQL schema defining the addCompanyToUser mutation." },
    { file: "frontend/addcompanytouser.jsx", role: "SUPPORTING CODE", reason: "Frontend component containing the add-company-to-user form and mutation." }
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
   await page.waitForSelector('.add-company-container');

3. Select User from User Dropdown:
   await page.waitForSelector('.add-company-container select', { state: 'attached' });
   await page.selectOption('.add-company-container select', { index: 1 });

4. Select Company from Company Dropdown:
   await page.waitForSelector('.add-company-container select.form-select', { state: 'attached' });
   await page.selectOption('.add-company-container select.form-select', { index: 1 });

5. Submit Association:
   await page.click('button.btn-submit');

6. Verify Success Message:
   await expect(page.locator('.add-company-container')).toContainText('Société associée avec succès');

IMPORTANT:
- Generate ONLY 1 clean, passing test suite.
`
};

