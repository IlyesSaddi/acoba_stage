module.exports = {
  keywords: [
    "retirer entreprise", "retirer une entreprise", "retirer entreprise utilisateur",
    "retirer une entreprise utilisateur", "retirer entreprise d un utilisateur",
    "retirer une entreprise d un utilisateur", "retirer une entreprise d'un utilisateur",
    "remove company from user", "supprimer entreprise utilisateur", "dissocier entreprise",
    "removecompanyfromuser", "dissocier une societe", "retirer societe",
    "retirer une societe d un utilisateur", "dissocier company", "dissocier une entreprise"
  ],

   name: "Retirer une entreprise d'un utilisateur",
  steps: [
    { id: "login", name: "Connexion", action: "await page.goto('http://localhost:5173/login'); await page.fill('input[placeholder=\"Entrer email\"]', 'saddi.ilyes1@gmail.com'); await page.fill('input[placeholder=\"Entrer mot de passe\"]', 'ilyes2003'); await page.click('button.login-btn'); await page.waitForURL('**/')" },
    { id: "navigate_company", name: "Navigation vers la page Entreprise", action: "await page.goto('http://localhost:5173/company'); await page.waitForSelector('.remove-company-container')" },
    { id: "select_user", name: "Sélectionner un utilisateur", action: "await page.waitForSelector('.remove-company-container .form-group:nth-of-type(1) select', { state: 'attached' }); await page.selectOption('.remove-company-container .form-group:nth-of-type(1) select', { index: 1 })" },
    { id: "select_company", name: "Sélectionner une entreprise associée", action: "await page.waitForSelector('.remove-company-container .form-group:nth-of-type(2) select', { state: 'attached' }); await page.selectOption('.remove-company-container .form-group:nth-of-type(2) select', { index: 1 })" },
    { id: "submit", name: "Soumettre la suppression", action: "await page.click('button.btn-remove')" },
    { id: "verify", name: "Vérifier le succès", action: "await expect(page.locator('.remove-company-container .success-msg')).toContainText('Société supprimée avec succès')" }
  ],
  resolverFile: "companytouser.js",

  functions: {
    main: [
      { functionName: "removeCompanyFromUser", role: "MAIN WORKFLOW", reason: "Main backend operation responsible for removing a company association from a user." }
    ],
    postCreation: [],
    alternative: [],
    unrelated: [
      { functionName: "addCompanyToUser", role: "UNRELATED", reason: "Addition operation — the inverse of this scenario." }
    ]
  },

  supporting: [
    { file: "models/User.js", role: "SUPPORTING CODE", reason: "Mongoose User model updated when a company is removed." },
    { file: "models/Company.js", role: "SUPPORTING CODE", reason: "Mongoose Company model referenced in the association." },
    { file: "graphql/schema/index.js", role: "SUPPORTING CODE", reason: "GraphQL schema defining the removeCompanyFromUser mutation." },
    { file: "frontend/removecompayfromuser.jsx", role: "SUPPORTING CODE", reason: "Frontend component containing the remove-company-from-user form and mutation." }
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
   await page.waitForSelector('.remove-company-container');

3. Select User from User Dropdown:
   await page.waitForSelector('.remove-company-container .form-group:nth-of-type(1) select', { state: 'attached' });
   await page.selectOption('.remove-company-container .form-group:nth-of-type(1) select', { index: 1 });

4. Select Associated Company from Dropdown:
   await page.waitForSelector('.remove-company-container .form-group:nth-of-type(2) select', { state: 'attached' });
   await page.selectOption('.remove-company-container .form-group:nth-of-type(2) select', { index: 1 });

5. Submit Removal:
   await page.click('button.btn-remove');

6. Verify Success Message:
   await expect(page.locator('.remove-company-container .success-msg')).toContainText('Société supprimée avec succès');

IMPORTANT:
- Generate ONLY 1 clean, passing test suite.
`
};

