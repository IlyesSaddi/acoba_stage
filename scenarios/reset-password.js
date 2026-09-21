module.exports = {
  keywords: [
    "reset password", "demande reinitialisation", "demande reset", "reinitialisation mot de passe",
    "request password", "forgot password", "mot de passe oublie", "requestpasswordreset",
    "mot de passe perdu", "recuperer mot de passe", "demander reinitialisation"
  ],

   name: "Demande de réinitialisation de mot de passe",
  steps: [
    { id: "navigate_forgot", name: "Navigation vers la page Mot de passe oublié", action: "await page.goto('http://localhost:5173/forgot-password')" },
    { id: "fill_email", name: "Remplir l'email", action: "await page.fill('input[placeholder=\"Your email\"]', 'saddi.ilyes1@gmail.com')" },
    { id: "click_submit", name: "Cliquer sur le bouton Soumettre", action: "await page.click('button[type=\"submit\"]')" },
    { id: "verify_message", name: "Vérifier le message de sortie", action: "await expect(page.locator('form p')).toBeVisible()" }
  ],
  resolverFile: "resetpassword.js",

  functions: {
    main: [
      { functionName: "requestPasswordReset", role: "MAIN WORKFLOW", reason: "Initiates the password reset process by sending a reset email." }
    ],
    postCreation: [],
    alternative: [],
    unrelated: [
      { functionName: "resetPassword", role: "UNRELATED", reason: "Completes the reset — a separate step after the request." }
    ]
  },

  supporting: [
    { file: "models/User.js", role: "SUPPORTING CODE", reason: "Mongoose User model used to find the user by email." },
    { file: "graphql/schema/index.js", role: "SUPPORTING CODE", reason: "GraphQL schema defining the requestPasswordReset mutation." },
    { file: "frontend/RequestPasswordResetForm.jsx", role: "SUPPORTING CODE", reason: "Frontend form component for requesting a password reset." }
  ],

  workflow: `
VERIFIED SELECTORS & EXACT PLAYWRIGHT CODE STEPS FOR PASSWORD RESET REQUEST

1. Navigate to Forgot Password Page:
   await page.goto('http://localhost:5173/forgot-password');

2. Fill Email Input:
   await page.fill('input[placeholder="Your email"]', 'saddi.ilyes1@gmail.com');

3. Click Submit Button:
   await page.click('button[type="submit"]');

4. Verify Output Message:
   await expect(page.locator('form p')).toBeVisible();

IMPORTANT:
- Generate ONLY 1 clean, passing test.
`
};

