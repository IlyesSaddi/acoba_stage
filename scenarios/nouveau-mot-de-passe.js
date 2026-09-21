module.exports = {
  keywords: [
    "nouveau mot de passe", "nouveau mdp", "resetpassword", "reset password confirm",
    "changer mot de passe", "change password", "nouveau password", "reinitialiser",
    "reinitialiser le mot de passe", "définir nouveau mot de passe"
  ],

   name: "Réinitialiser le mot de passe",
  steps: [
    { id: "navigate_reset", name: "Navigation vers la page de réinitialisation", action: "await page.goto('http://localhost:5173/reset-password/sample-reset-token-123')" },
    { id: "fill_new_password", name: "Remplir le nouveau mot de passe", action: "await page.fill('input[placeholder=\"New password\"]', 'NewSecurePassword123!')" },
    { id: "click_submit", name: "Cliquer sur le bouton Soumettre", action: "await page.click('button[type=\"submit\"]')" },
    { id: "verify_output", name: "Vérifier le composant de message", action: "await expect(page.locator('form p')).toBeVisible()" }
  ],
  resolverFile: "resetpassword.js",

  functions: {
    main: [
      { functionName: "resetPassword", role: "MAIN WORKFLOW", reason: "Completes the password reset by setting a new password using the reset token." }
    ],
    postCreation: [],
    alternative: [],
    unrelated: [
      { functionName: "requestPasswordReset", role: "UNRELATED", reason: "The initial request step — not part of completing the reset." }
    ]
  },

  supporting: [
    { file: "models/User.js", role: "SUPPORTING CODE", reason: "Mongoose User model used to find and update the user's password." },
    { file: "graphql/schema/index.js", role: "SUPPORTING CODE", reason: "GraphQL schema defining the resetPassword mutation." },
    { file: "frontend/ResetPasswordForm.jsx", role: "SUPPORTING CODE", reason: "Frontend form component where the user enters a new password." }
  ],

  workflow: `
VERIFIED SELECTORS & EXACT PLAYWRIGHT CODE STEPS FOR RESET PASSWORD CONFIRMATION

1. Navigate to Reset Password Token Page:
   await page.goto('http://localhost:5173/reset-password/sample-reset-token-123');

2. Fill New Password Input:
   await page.fill('input[placeholder="New password"]', 'NewSecurePassword123!');

3. Click Submit Button:
   await page.click('button[type="submit"]');

4. Verify Output Message Component:
   await expect(page.locator('form p')).toBeVisible();

IMPORTANT:
- Generate ONLY 1 clean, passing test.
`
};

