# Rapport de test — Login
Date: 21/09/2026 21:51:53
Statut final: ❌ ÉCHOUÉ

## Étapes du scénario

| # | Étape | Statut | Détail |
|---|-------|--------|--------|
| 1 | Navigation vers la page de connexion | ❌ | Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
Call log:
[2m  - navigating to "http://localhost:5173/", waiting until "load"[22m
 |
| 2 | Remplir email et mot de passe | ❌ | Échoué |
| 3 | Cliquer sur le bouton de connexion | ❌ | Échoué |
| 4 | Vérifier l'authentification réussie | ❌ | Échoué |

**Résumé: 0/4 étapes réussies, 4 échecs**

## Détails des étapes

### navigate_login: Navigation vers la page de connexion — ❌ ÉCHOUÉ
- Erreur: Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
Call log:
[2m  - navigating to "http://localhost:5173/", waiting until "load"[22m


### fill_credentials: Remplir email et mot de passe — ❌ ÉCHOUÉ

### click_login: Cliquer sur le bouton de connexion — ❌ ÉCHOUÉ

### verify_auth: Vérifier l'authentification réussie — ❌ ÉCHOUÉ

## Analyse des causes

Les étapes suivantes ont échoué: Navigation vers la page de connexion, Remplir email et mot de passe, Cliquer sur le bouton de connexion, Vérifier l'authentification réussie
Les causes possibles:
- Sélecteurs non trouvés dans le code frontend
- Problème d'authentification
- Timeout de chargement des pages
- Erreurs côté backend

## Prochaines étapes

- Corriger les sélecteurs échoués
- Revérifier la connexion au backend
- Relancer le test après correction

## 🎯 Localisation exacte de la panne & Solution de code proposée

### 📍 Fichier et Ligne de Code Défectueux
**Fichier:** `login.spec.js`  
**Ligne de Code Défectueuse:** 5

### ❌ Extrait du Code en Panne
```javascript
  3 | test.describe('Login Test', () => {
  4 |   test('Successful login', async ({ page }) => {
> 5 |     await page.goto('http://localhost:5173');
  6 |     await page.fill('input[placeholder=\"Entrer email\"]','saddi.ilyes1@gmail.com');
  7 |     await page.fill('input[placeholder=\"Entrer mot de passe\"]', 'ilyes2003');
  8 |     await page.click('button.login-btn');
```

### 💡 Solution de Code Recommandée
Le test échoue parce que la page ne peut pas se connecter à `http://localhost:5173`, ce qui suggère que le serveur backend n'est pas en cours d'exécution ou qu'il y a un problème de configuration du réseau.

Pour résoudre ce problème, vous devez vous assurer que le serveur backend est en cours d'exécution avant d'exécuter le test. Vous pouvez utiliser un script de démarrage pour lancer le serveur avant d'exécuter le test.

Voici une solution possible en utilisant `playwright` et `node-cron` pour s'assurer que le serveur est en cours d'exécution avant le test:

1. **Ajouter un script de démarrage pour le serveur:**

   Créez un fichier `start-server.js` pour démarrer le serveur:

   ```javascript
   const express = require('express');
   const app = express();
   const port = 5173;

   app.get('/', (req, res) => res.send('Server is running'));

   app.listen(port, () => {
     console.log(`Server running at http://localhost:${port}/`);
   });
   ```

2. **Modifier le fichier de test pour démarrer le serveur avant l'exécution du test:**

   Modifiez `login.spec.js` pour inclure le démarrage du serveur avant l'exécution du test:

   ```javascript
   const { exec } = require('child_process');

   test.describe('Login Test', () => {
     beforeAll(async () => {
       // Démarrer le serveur avant le test
       const startServer = exec('node start-server.js');
       await new Promise((resolve) => startServer.on('close', resolve));
     });

     test('Successful login', async ({ page }) => {
       await page.goto('http://localhost:5173');
       await page.fill('input[placeholder="Entrer email"]', 'saddi.ilyes1@gmail.com');
       await page.fill('input[placeholder="Entrer mot de passe"]', 'ilyes2003');
       await page.click('button.login-btn');
       // Ajouter des assertions pour vérifier l'authentification réussie
     });
   });
   ```

Cette solution garantit que le serveur est en cours d'exécution avant que le test de navigation ne commence, résolvant ainsi l'erreur de connexion refusée.
