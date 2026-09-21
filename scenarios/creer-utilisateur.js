module.exports = {
  name: "Créer un utilisateur",
  steps: [
    { id: "navigate_login", name: "Navigation vers la page de connexion", action: "await page.goto('http://localhost:5173/login')" },
    { id: "switch_signup", name: "Basculer en mode Inscription", action: "await page.click('button.signup-btn')" },
    { id: "fill_credentials", name: "Remplir email et mot de passe", action: "await page.fill('input[placeholder=\"Entrer email\"]', 'user_' + Date.now() + '@example.com'); await page.fill('input[placeholder=\"Entrer mot de passe\"]', 'password123')" },
    { id: "submit_form", name: "Soumettre le formulaire d'inscription", action: "await page.click('button.login-btn')" },
    { id: "verify_success", name: "Vérifier le message de succès", action: "await expect(page.locator('.success-message')).toContainText('Compte créé avec succès')" }
  ],
  keywords: [
    "creer utilisateur", "creer un utilisateur", "create user", "inscription", "register",
    "créer utilisateur", "créer un utilisateur", "nouveau utilisateur", "sign up", "signup",
    "creer un compte", "creer compte", "s'inscrire", "sinscrire"
  ],
  resolverFile: "Users.js",
  functions: {
    main: [
      { functionName: "createUser", role: "MAIN WORKFLOW", reason: "Main backend operation responsible for user creation." }
    ],
    postCreation: [
      { functionName: "confirmUser", role: "POST-CREATION CONFIRMATION", reason: "Confirms the account after the creation process." }
    ],
    alternative: [
      { functionName: "resendConfirmationEmail", role: "ALTERNATIVE WORKFLOW", reason: "Recovery operation for a missing confirmation email." }
    ],
    unrelated: [
      { functionName: "login", role: "UNRELATED", reason: "Authentication operation. It is not required to create a user." },
      { functionName: "users", role: "UNRELATED", reason: "Retrieves users and does not participate in user creation." }
    ]
  },
  supporting: [
    { file: "models/User.js", role: "SUPPORTING CODE", reason: "Mongoose User model used by createUser and confirmUser." },
    { file: "graphql/schema/index.js", role: "SUPPORTING CODE", reason: "GraphQL schema defining createUser and confirmUser mutations." },
    { file: "frontend/Login.jsx", role: "SUPPORTING CODE", reason: "Frontend component containing the createUser GraphQL mutation." }
  ],
  workflow: `
VERIFIED SELECTORS & EXACT PLAYWRIGHT CODE STEPS FOR CREATING A USER

1. Navigate to the login page:
   await page.goto('http://localhost:5173/login');

2. Switch to Sign Up mode (if form is currently in Login mode):
   await page.click('button.signup-btn');

3. Fill Email and Password fields:
   await page.fill('input[placeholder="Entrer email"]', 'user_' + Date.now() + '@example.com');
   await page.fill('input[placeholder="Entrer mot de passe"]', 'password123');

4. Submit the registration form:
   await page.click('button.login-btn');

5. Verify Success Message:
   await expect(page.locator('.success-message')).toContainText('Compte créé avec succès');

IMPORTANT RULES:
- Generate ONLY 1 clean, passing test suite.
- Do NOT simulate email confirmation tokens unless explicitly tested.
`
};
