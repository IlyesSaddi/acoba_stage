module.exports = {
  keywords: [
    "login", "connexion", "se connecter", "signin", "sign in", "authentification",
    "authenticate", "log in", "se loguer", "se connecter a l'application"
  ],

  name: "Login",
  steps: [
    { id: "navigate_login", name: "Navigation vers la page de connexion", action: "await page.goto('http://localhost:5173/login')" },
    { id: "fill_credentials", name: "Remplir email et mot de passe", action: "await page.fill('input[placeholder=\"Entrer email\"]', 'saddi.ilyes1@gmail.com'); await page.fill('input[placeholder=\"Entrer mot de passe\"]', 'ilyes2003')" },
    { id: "click_login", name: "Cliquer sur le bouton de connexion", action: "await page.click('button.login-btn')" },
    { id: "verify_auth", name: "Vérifier l'authentification réussie", action: "await page.waitForURL('**/'); await expect(page).toHaveURL('http://localhost:5173/')" }
  ],
  resolverFile: "Users.js",

  functions: {
    main: [
      { functionName: "login", role: "MAIN WORKFLOW", reason: "Main backend operation responsible for user authentication." }
    ],
    postCreation: [],
    alternative: [],
    unrelated: [
      { functionName: "createUser", role: "UNRELATED", reason: "User creation operation, not required for login." },
      { functionName: "users", role: "UNRELATED", reason: "Retrieves users and does not participate in login." }
    ]
  },

  supporting: [
    { file: "models/User.js", role: "SUPPORTING CODE", reason: "Mongoose User model used to find and validate the user." },
    { file: "graphql/schema/index.js", role: "SUPPORTING CODE", reason: "GraphQL schema defining the login mutation." },
    { file: "frontend/Login.jsx", role: "SUPPORTING CODE", reason: "Frontend component containing the login form and GraphQL mutation." }
  ],

  workflow: `
VERIFIED SELECTORS & EXACT PLAYWRIGHT CODE STEPS FOR LOGIN

1. Navigate to Login Page:
   await page.goto('http://localhost:5173/login');

2. Fill Email and Password fields:
   await page.fill('input[placeholder="Entrer email"]', 'saddi.ilyes1@gmail.com');
   await page.fill('input[placeholder="Entrer mot de passe"]', 'ilyes2003');

3. Click Login Button:
   await page.click('button.login-btn');

4. Verify Successful Authentication & Navigation:
   await page.waitForURL('**/');
   await expect(page).toHaveURL('http://localhost:5173/');

IMPORTANT:
- Generate ONLY 1 clean, passing test.
`
};

