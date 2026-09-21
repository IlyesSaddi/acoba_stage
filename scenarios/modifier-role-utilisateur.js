module.exports = {
  keywords: [
    "modifier role", "modifier le role", "update role", "changer role",
    "updateuserrole", "update user role", "changer le role", "modifier role utilisateur",
    "changer role utilisateur", "modifier le role d'un utilisateur", "modifier role d'un utilisateur",
    "changement role", "changement de role", "changer de role", "update role utilisateur"
  ],

   name: "Modifier le rôle d'un utilisateur",
  steps: [
    { id: "login", name: "Connexion", action: "await page.goto('http://localhost:5173/login'); await page.fill('input[placeholder=\"Entrer email\"]', 'saddi.ilyes1@gmail.com'); await page.fill('input[placeholder=\"Entrer mot de passe\"]', 'ilyes2003'); await page.click('button.login-btn'); await page.waitForURL('**/')" },
    { id: "navigate_users", name: "Navigation vers la page des utilisateurs", action: "await page.goto('http://localhost:5173/users'); await page.waitForSelector('.update-user-role-container')" },
    { id: "select_user", name: "Sélectionner un utilisateur", action: "await page.waitForSelector('.update-user-role-container select', { state: 'attached' }); await page.selectOption('.update-user-role-container select', { index: 1 })" },
    { id: "select_role", name: "Sélectionner le nouveau rôle", action: "await page.selectOption('.update-user-role-container select.form-select', 'client')" },
    { id: "submit", name: "Soumettre le formulaire", action: "await page.click('button.btn-update-role')" },
    { id: "verify", name: "Vérifier le succès", action: "await expect(page.locator('.message-success')).toContainText('Rôle mis à jour avec succès')" }
  ],
  resolverFile: "updateuserrole.js",

  functions: {
    main: [
      { functionName: "updateUserRole", role: "MAIN WORKFLOW", reason: "Main backend operation responsible for changing a user's role." }
    ],
    postCreation: [],
    alternative: [],
    unrelated: []
  },

  supporting: [
    { file: "models/User.js", role: "SUPPORTING CODE", reason: "Mongoose User model used by updateUserRole to find and update the user." },
    { file: "graphql/schema/index.js", role: "SUPPORTING CODE", reason: "GraphQL schema defining the updateUserRole mutation." },
    { file: "frontend/updateuserrole.jsx", role: "SUPPORTING CODE", reason: "Frontend component containing the role update form and mutation." }
  ],

  workflow: `
AUTHENTICATION PREREQUISITE & NAVIGATION

This page requires the user to be logged in and navigate to /users.
The test MUST login first before accessing the users page.

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

2. Navigate to Users Page:
   await page.goto('http://localhost:5173/users');
   await page.waitForSelector('.update-user-role-container');

3. Select User from User Dropdown:
   await page.waitForSelector('.update-user-role-container select', { state: 'attached' });
   await page.selectOption('.update-user-role-container select', { index: 1 });

4. Select New Role:
   await page.selectOption('.update-user-role-container select.form-select', 'client');

5. Submit Form:
   await page.click('button.btn-update-role');

6. Verify Success Message:
   await expect(page.locator('.message-success')).toContainText('Rôle mis à jour avec succès');

IMPORTANT:
- Generate ONLY 1 clean, passing test suite.
`
};

