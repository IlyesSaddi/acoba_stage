# 🤖 Cam2Drive AI Testing Engine

> **Automatisation Intelligente des Tests Cam2Drive**  
> Architecture d'auto-guérison et de non-régression propulsée par LLM

---

## 📋 Table des Matières

- [Vue d'ensemble](#-vue-densemble)
- [Stack Technique](#-stack-technique)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Utilisation](#-utilisation)
- [Architecture du Pipeline](#-architecture-du-pipeline)
- [Scénarios Supportés](#-scénarios-supportés)
- [Algorithmes Clés](#-algorithmes-clés)
- [Structure du Projet](#-structure-du-projet)
- [Rapports Générés](#-rapports-générés)

---

## 🎯 Vue d'ensemble

Ce projet est un pipeline CLI Node.js qui **génère, exécute et auto-corrige** des tests end-to-end Playwright pour l'application Cam2Drive — de manière entièrement autonome via l'IA.

Il remplace l'exécution manuelle fastidieuse par un moteur intelligent capable de :

- 🧠 **Comprendre l'intention** de l'utilisateur en langage naturel (NLP + Fuzzy Matching)
- ⚙️ **Générer des tests Playwright** basés sur le vrai code source (backend + frontend)
- 🔄 **Auto-corriger** les tests échoués via une boucle Run-and-Heal (jusqu'à 5 tentatives)
- 📍 **Localiser la panne exacte** (fichier, ligne, extrait de code) grâce au Root Cause Analysis IA
- 📊 **Produire des rapports** détaillés par étape avec diagnostic précis

---

## 🛠 Stack Technique

| Technologie | Rôle |
|---|---|
| **Node.js** | Runtime et orchestration CLI |
| **Playwright** | Exécution des tests end-to-end (Chromium, headless) |
| **AWS Bedrock** | IA cloud — Génération, Heal, Root Cause Analysis |
| **Amazon Nova Micro** | Modèle LLM principal (`eu.amazon.nova-micro-v1:0`) |
| **Groq SDK** | Benchmarking LLM alternatif (GPT-OSS 120B, Qwen) |
| **GraphQL** | Backend Cam2Drive (resolvers Node.js + Mongoose) |
| **React + Vite** | Frontend Cam2Drive (localhost:5173) |

---

## 🚀 Installation

```bash
# 1. Cloner le projet
git clone <repo-url>
cd ai-test-generator

# 2. Installer les dépendances
npm install

# 3. Installer les navigateurs Playwright
npx playwright install chromium
```

---

## ⚙️ Configuration

Créer un fichier `.env` à la racine :

```env
# AWS Bedrock
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Modèle de génération (défaut : Nova Micro)
BEDROCK_MODEL_ID=eu.amazon.nova-micro-v1:0

# Modèle de Heal (optionnel — peut être plus puissant)
BEDROCK_HEAL_MODEL_ID=eu.amazon.nova-micro-v1:0
```

> **Note :** Si `AWS_ACCESS_KEY_ID` n'est pas défini, le SDK utilise `~/.aws/credentials` ou le rôle IAM.

---

## 💻 Utilisation

### Commande principale

```bash
node src/run-and-heal.js "<scénario>"
```

### Exemples

```bash
# Générer et exécuter un test (5 tentatives d'auto-correction)
node src/run-and-heal.js "Créer un device"
node src/run-and-heal.js "Login"
node src/run-and-heal.js "Réinitialisation mot de passe"

# Forcer la régénération du test (ignorer le fichier existant)
node src/run-and-heal.js --fresh "Créer un device"

# Exécuter sans auto-correction (1 seul run, rapport immédiat)
node src/run-and-heal.js --no-heal "Login"
```

### Via npm

```bash
npm run run-test "Créer un device"
```

### Entrée en langage naturel (tolérance aux fautes)

```bash
node src/run-and-heal.js "crrrer unn device"      # ✅ Détecté : Créer un device
node src/run-and-heal.js "creer un nouveau devic"  # ✅ Détecté : Créer un device
node src/run-and-heal.js "je veux login"           # ✅ Détecté : Login
node src/run-and-heal.js "supprimmer entreprise"   # ✅ Détecté : Supprimer une entreprise
```

---

## 🏗 Architecture du Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│  ENTRÉE : node src/run-and-heal.js "Créer un device"        │
└─────────────────────┬───────────────────────────────────────┘
                      │
          ┌───────────▼───────────┐
          │   ÉTAPE 1 — NLP       │  scenarios/index.js
          │   Fuzzy Matching      │  Normalize → Levenshtein →
          │   → Scénario trouvé   │  Sliding Window → Token Bag
          └───────────┬───────────┘
                      │
          ┌───────────▼───────────┐
          │   ÉTAPE 2 — CONTEXTE  │  src/test-workflow-context.js
          │   Extraction code     │  Resolver backend (brace-aware)
          │   backend + sélecteurs│  Sélecteurs CSS React (regex)
          │   CSS vérifiés        │  → Prompt structuré
          └───────────┬───────────┘
                      │
          ┌───────────▼───────────┐
          │   ÉTAPE 3 — GÉNÉRATION│  services/bedrockService.js
          │   AWS Bedrock LLM     │  askBedrock() → Nova Micro
          │   → test.spec.js      │  Température 0, max 4096 tokens
          └───────────┬───────────┘
                      │
          ┌───────────▼───────────┐
          │   ÉTAPE 4 — EXÉCUTION │  npx playwright test --reporter=json
          │   Playwright          │  Chromium headless
          │   ✅ Succès / ❌ Échec │  Résultat JSON parsé
          └───────────┬───────────┘
                      │
           ┌──────────▼──────────────────────────────────────┐
           │  ❌ ÉCHEC → BOUCLE HEAL (max 5 tentatives)       │
           │                                                  │
           │  • Algorithme LCS → identifie l'étape exacte    │
           │    en panne (PASSÉ / ÉCHOUÉ / BLOQUÉ)           │
           │  • askBedrockHeal() → code Playwright corrigé   │
           │  • Re-run Playwright                             │
           │                                                  │
           │  Après 5 échecs :                                │
           │  • askBedrockRootCause() → fichier exact +       │
           │    ligne + code en panne + solution recommandée  │
           └─────────────────────────────────────────────────┘
                      │
          ┌───────────▼───────────┐
          │   ÉTAPE 5 — RAPPORT   │  test-reports/{slug}-report.md
          │   Markdown détaillé   │  Étapes ✅/❌, Root Cause Analysis
          └───────────────────────┘
```

---

## 🗂 Scénarios Supportés

| # | Nom | Resolver Backend | Frontend |
|---|---|---|---|
| 1 | Créer un utilisateur | `Users.js` → `createUser` | `Login.jsx` |
| 2 | Login / Connexion | `Users.js` → `login` | `Login.jsx` |
| 3 | Réinitialisation mot de passe | `resetpassword.js` → `requestPasswordReset` | `RequestPasswordResetForm.jsx` |
| 4 | Nouveau mot de passe | `resetpassword.js` → `resetPassword` | `ResetPasswordForm.jsx` |
| 5 | Créer une entreprise | `Companies.js` → `createCompany` | `company.jsx` |
| 6 | Supprimer une entreprise | `Companies.js` → `deleteCompany` | `company.jsx` |
| 7 | Créer un device | `Devices.js` → `createDevice` | `createdevice.jsx` |
| 8 | Supprimer un device | `Devices.js` → `deleteDeviceByName` | `deletedevice.jsx` |
| 9 | Modifier un device | `Devices.js` → `updateDevice` | `updatedevice.jsx` |
| 10 | Modifier le rôle utilisateur | `updateuserrole.js` → `updateUserRole` | `updateuserrole.jsx` |
| 11 | Ajouter entreprise à utilisateur | `companytouser.js` → `addCompanyToUser` | `addcompanytouser.jsx` |
| 12 | Retirer entreprise d'un utilisateur | `companytouser.js` → `removeCompanyFromUser` | `removecompayfromuser.jsx` |

---

## 🧠 Algorithmes Clés

### 1. Pipeline NLP + Fuzzy Matching (`scenarios/index.js`)

La résolution de scénario se fait en 4 niveaux de tolérance :

#### Niveau 1 — Normalisation
```
"Svp, je veux créer UN nouveau Device !!"
  → lowercase                   → "svp, je veux créer un nouveau device !!"
  → strip accents (NFD)         → "svp, je veux creer un nouveau device !!"
  → repeated char collapse      → "crrrer" → "creer"  |  "unn" → "un"
     regex: /(.)\\1{2,}/g
  → strip special chars         → "svp je veux creer un nouveau device"
```

#### Niveau 2 — Distance de Levenshtein DP O(m×n)
Compte les insertions, suppressions, substitutions minimales :
```
"devic"  → "device"  = distance 1  ✅ Toléré (≤25% longueur)
"dvice"  → "device"  = distance 2  ✅ Toléré
"login"  → "device"  = distance 5  ❌ Rejeté
```

#### Niveau 3 — Sliding-Window Levenshtein
Cherche un mot-clé dans une phrase longue en testant chaque fenêtre de même taille :
```
Input   : "je veux creer un nouveau device samsung"
Keyword : "creer device"
Fenêtre optimale détectée → distance minimale = 2 ✅
```

#### Niveau 4 — Fuzzy Token Matching (Bag-of-Words)
L'ordre des mots est indépendant. Chaque token du keyword doit trouver son correspondant dans l'input :
```
Input   : "device nouveau creer"
Keyword : "creer device"
→ "creer" trouvé ✅  |  "device" trouvé ✅  → MATCH
```

#### Fallback — `suggestScenarios()`
Si aucun scénario ne passe la tolérance, propose les 3 plus proches :
```
❓ Scénario non trouvé: "xxxxxxxxxxx"
💡 Vouliez-vous dire ?
   1. Créer un device
   2. Login
   3. Créer une entreprise
```

---

### 2. Algorithme LCS — Attribution des Erreurs par Étape (`run-and-heal.js`)

**Problème :** Playwright dit `Test Failed` mais ne précise pas quelle étape a échoué.

**Solution :** Longest Common Substring (DP O(m×n)) entre le message d'erreur et chaque étape.

```
Erreur Playwright : "Timeout waiting for input[name=name] after 5000ms"

LCS calculé pour chaque étape du scénario :
  Étape 1 "Connexion"                   → LCS = 0  → ✅ PASSÉ
  Étape 2 "Ouvrir le modal"             → LCS = 2  → ✅ PASSÉ
  Étape 3 "Remplir le formulaire"       → LCS = 7  → ❌ ÉCHOUÉ ← COUPABLE (max)
  Étape 4 "Sélectionner une entreprise" → LCS = 3  → ⚠️  BLOQUÉ
  Étape 5 "Soumettre et vérifier"       → LCS = 1  → ⚠️  BLOQUÉ
```

---

### 3. Extraction Brace-Aware des Fonctions Backend (`test-workflow-analyzer.js`)

`extractFunctionCode(code, functionName)` parse les accolades JavaScript de manière récursive pour extraire le corps **complet** d'une fonction backend (même si elle contient des strings avec `{}`).

---

### 4. Zéro Hallucination — Sélecteurs CSS Extraits du Code React

Les sélecteurs ne sont **jamais inventés** par le LLM. Ils sont extraits du code source React et injectés dans le prompt Bedrock avec l'instruction stricte :

> *"Use ONLY these selectors. Do NOT invent any other selector."*

Sélecteurs extraits et vérifiés :
```
input[placeholder="Entrer email"]         → Login.jsx
input[placeholder="Entrer mot de passe"]  → Login.jsx
button.login-btn                          → Login.jsx
button.btn-create-device                  → createdevice.jsx
input[name="name"]                        → modal form
select[name="company_name"]               → company dropdown
button.btn:has-text("Confirm")            → modal confirm
p.success-message                         → success feedback
```

---

## 📁 Structure du Projet

```
ai-test-generator/
│
├── scenarios/                       # Dictionnaire des 12 scénarios
│   ├── index.js                     # Registry + NLP + Fuzzy Matching
│   ├── creer-utilisateur.js
│   ├── login.js
│   ├── reset-password.js
│   ├── nouveau-mot-de-passe.js
│   ├── creer-entreprise.js
│   ├── supprimer-entreprise.js
│   ├── creer-device.js
│   ├── supprimer-device.js
│   ├── modifier-device.js
│   ├── modifier-role-utilisateur.js
│   ├── ajouter-entreprise-utilisateur.js
│   └── retirer-entreprise-utilisateur.js
│
├── services/
│   └── bedrockService.js            # 3 fonctions Bedrock
│                                    # askBedrock() / askBedrockHeal() / askBedrockRootCause()
│
├── src/
│   ├── run-and-heal.js              # 🎯 Point d'entrée principal — Pipeline complet
│   ├── test-workflow-context.js     # Construction du prompt Bedrock
│   ├── test-workflow-analyzer.js    # Analyse resolver + extractFunctionCode()
│   ├── step-tracker.js              # Suivi des étapes (PASSÉ / ÉCHOUÉ / BLOQUÉ)
│   ├── step-report.js               # Génération des rapports Markdown
│   ├── generate-step-report.js      # Helper rapport
│   ├── llm-client.js                # Client LLM générique
│   ├── measure-bedrock.js           # Benchmark Bedrock
│   ├── measure-tokens.js            # Benchmark tokens (Groq/OpenAI)
│   ├── generated-tests/             # Tests Playwright générés (auto-créé)
│   └── retriever/                   # Modules d'extraction de contexte
│       ├── codeExtractor.js         # Extraction code backend/frontend
│       ├── fileRanker.js            # Classement des fichiers pertinents
│       ├── dependencyAnalyzer.js    # Analyse des dépendances
│       ├── intentExtractor.js       # Extraction d'intention NLP
│       ├── keywordExtractor.js      # Extraction de mots-clés
│       ├── retriever.js             # Orchestrateur retriever
│       ├── scanner.js               # Scan du projet
│       └── workflowContextBuilder.js# Construction du contexte workflow
│
├── test-reports/                    # Rapports Markdown générés (auto-créé)
├── test-results/                    # Résultats JSON Playwright (auto-créé)
├── playwright.config.ts             # Config Playwright (Chromium headless, port 5173)
├── package.json
├── .env                             # Variables d'environnement (non versionné)
└── README.md
```

---

## 📊 Rapports Générés

Les rapports sont sauvegardés dans `test-reports/{scenario-slug}-report.md`.

### Exemple de rapport réussi

```markdown
# Rapport de test — Créer un device
Date: 21/09/2026

Statut final: ✅ PASSÉ

## Étapes du scénario
| # | Étape                        | Statut | Détail  |
|---|------------------------------|--------|---------|
| 1 | Connexion                    | ✅     | Succès  |
| 2 | Ouvrir le modal de création  | ✅     | Succès  |
| 3 | Remplir le formulaire        | ✅     | Succès  |
| 4 | Sélectionner une entreprise  | ✅     | Succès  |
| 5 | Soumettre et vérifier        | ✅     | Succès  |

Résumé: 5/5 étapes réussies, 0 échecs
```

### Exemple de rapport avec Root Cause Analysis

```markdown
Statut final: ❌ ÉCHOUÉ (après 5 tentatives)

| 3 | Remplir le formulaire | ❌ | Timeout input[name=name] after 5000ms |

## 🎯 Localisation exacte de la panne & Solution de code proposée

### 📍 Fichier et Ligne de Code Défectueux
Fichier: creer-un-device.spec.js — Ligne: 11

### ❌ Extrait du Code en Panne
await page.click('button.btn-create-device');
await page.waitForSelector('input[name="name"]');

### 💡 Solution de Code Recommandée
const btn = page.locator('button.btn-create-device');
await btn.waitFor({ state: 'visible', timeout: 60000 });
await btn.click();
await page.waitForSelector('input[name="name"]', { state: 'visible' });
```

---

## 🔧 Variables d'Environnement

| Variable | Défaut | Description |
|---|---|---|
| `AWS_REGION` | `eu-west-1` | Région AWS Bedrock |
| `AWS_ACCESS_KEY_ID` | — | Clé d'accès AWS |
| `AWS_SECRET_ACCESS_KEY` | — | Clé secrète AWS |
| `BEDROCK_MODEL_ID` | `eu.amazon.nova-micro-v1:0` | Modèle de génération initiale |
| `BEDROCK_HEAL_MODEL_ID` | idem que MODEL_ID | Modèle de Heal (peut être plus puissant) |

---

## 📈 Benchmark LLM (Résultats Réels)

| Modèle | Tokens | Temps | Statut |
|---|---|---|---|
| **GPT-OSS 120B (Groq)** ⭐ | 1 245 / 4 277 | 3.55s | ✅ Sortie Complète |
| Qwen 3.8 27B | 368 / 4 622 | 1.31s | ⚡ Ultra-rapide, sortie courte |
| GPT-OSS 20B | 2 048 / 4 277 | 3.05s | ❌ Tronqué |
| Qwen 3.6 27B | 2 048 / 4 620 | 4.68s | ❌ Tronqué |
| **Amazon Nova Micro** | 295 / 4 638 | 2.22s | ✅ Économique (production) |

> Modèle de production choisi : **Amazon Nova Micro** — intégration AWS native, coût optimal, température 0 pour des sorties déterministes et reproductibles.

---

## 📝 Licence

ISC — Projet de stage Cam2Drive 2025
