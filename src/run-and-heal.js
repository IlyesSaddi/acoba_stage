require("dotenv").config();

const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { askBedrock, askBedrockHeal, askBedrockRootCause } = require("../services/bedrockService");
const { getScenarioInfo, buildStepReport, trackStep } = require("./step-tracker");

const args = process.argv.slice(2);
const forceRegenerate = args.includes("--fresh");
const noHeal = args.includes("--no-heal");
const scenarioArgs = args.filter((a) => a !== "--fresh" && a !== "--no-heal");
const scenario = scenarioArgs.join(" ") || "Créer un device";
const MAX_RETRIES = noHeal ? 1 : 5;

const GENERATED_TESTS_DIR = path.join(__dirname, "generated-tests");
const REPORTS_DIR = path.join(__dirname, "..", "test-reports");
const PLAYWRIGHT_OUT_DIR = path.join(__dirname, "..", "test-results");

function scenarioToFilename(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const slug = scenarioToFilename(scenario);
const testFile = path.join(GENERATED_TESTS_DIR, `${slug}.spec.js`);

function getStepResultsFromOutput(playwrightOutput, scenarioSteps) {
  const stepResults = [];
  const output = playwrightOutput;
  const hasAnyError = output.includes("FAIL") || output.includes("✘") || output.includes("Error");

  for (const step of scenarioSteps) {
    if (hasAnyError) {
      const errorMatch = output.match(new RegExp(`${step.id}.*?Error:.*?(?=\n|$)`));
      const error = errorMatch ? errorMatch[0] : `Étape "${step.name}" échouée`;
      stepResults.push(trackStep(step.id, step.name, false, error));
    } else {
      stepResults.push(trackStep(step.id, step.name, true));
    }
  }

  return stepResults;
}

function lcsLength(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  let best = 0;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
        if (dp[i][j] > best) best = dp[i][j];
      } else {
        dp[i][j] = 0;
      }
    }
  }
  return best;
}

function normalizeForMatch(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ");
}

/**
 * Per-step attribution from Playwright's JSON reporter.
 * Playwright reports at TEST level, so on failure we attribute the error to
 * the scenario step whose action/name best matches the error message
 * (longest common substring). Steps before the failing one are PASSÉ,
 * the failing one is ❌ ÉCHOUÉ, steps after are blocked (❌).
 */
function getStepsFromPlaywrightJson(jsonOutput, scenarioSteps) {
  try {
    const data = JSON.parse(jsonOutput);
    const errors = [];
    let hasSuccessfulResult = false;

    const allTests = [];
    const collectTests = (suites) => {
      for (const suite of suites || []) {
        for (const spec of suite.specs || []) {
          for (const test of spec.tests || []) {
            allTests.push(test);
          }
        }
        collectTests(suite.suites);
      }
    };
    collectTests(data.suites);

    for (const test of allTests) {
      const status = test.status || "untested";
      const expected = test.expectedStatus || "passed";
      const resultStatuses = (test.results || []).map((result) => result.status);
      if (status === "expected" || resultStatuses.includes("passed")) {
        hasSuccessfulResult = true;
      }
      for (const result of test.results || []) {
        if (result.error) errors.push(result.error.message);
        if (result.error && result.error.location) {
          errors.push(`${result.error.location.file || ""}:${result.error.location.line || ""}`);
        }
      }
      if (expected === "passed" && status !== "expected" && status !== "passed" && errors.length === 0 && test.results && test.results.length > 0) {
        errors.push(test.title || "Test failed");
      }
    }

    if (errors.length === 0 && hasSuccessfulResult) {
      return scenarioSteps.map(step => trackStep(step.id, step.name, true));
    }

    const normalizedErrors = errors.map(e => normalizeForMatch(e)).join(" \n ");

    let failIndex = -1;
    let bestLen = 0;
    scenarioSteps.forEach((step, i) => {
      const haystack = normalizeForMatch(`${step.name} ${step.action || ""}`);
      const len = lcsLength(normalizedErrors, haystack);
      if (len > bestLen) {
        bestLen = len;
        failIndex = i;
      }
    });

    if (bestLen < 5) failIndex = -1; // aucun match fiable → on échoue tout

    return scenarioSteps.map((step, i) => {
      if (failIndex === -1) {
        return trackStep(step.id, step.name, false, errors[0]);
      }
      if (i === failIndex) {
        return trackStep(step.id, step.name, false, errors[0]);
      }
      return trackStep(step.id, step.name, i < failIndex);
    });
  } catch (e) {
    return null;
  }
}

function runPlaywright() {
  console.log(`
==========================================
STEP 2 — RUNNING PLAYWRIGHT
==========================================
File: ${testFile}
`);

  const jsonOutputFile = path.join(PLAYWRIGHT_OUT_DIR, "playwright-results.json");

  if (!fs.existsSync(PLAYWRIGHT_OUT_DIR)) {
    fs.mkdirSync(PLAYWRIGHT_OUT_DIR, { recursive: true });
  }

  const result = spawnSync(
    "npx",
    ["playwright", "test", "--config=playwright.config.ts", testFile, "--reporter=json", `--output=${PLAYWRIGHT_OUT_DIR}`],
    { encoding: "utf8", stdio: "pipe" }
  );

  const output = (result.stdout || "") + (result.stderr || "");
  const passed = result.status === 0;

  let jsonOutput = "";
  if (fs.existsSync(jsonOutputFile) && fs.statSync(jsonOutputFile).isFile()) {
    jsonOutput = fs.readFileSync(jsonOutputFile, "utf8");
    fs.unlinkSync(jsonOutputFile);
  } else {
    // Le reporter JSON écrit sur stdout : on extrait le JSON à partir de la 1re accolade
    const firstBrace = result.stdout.indexOf("{");
    if (firstBrace !== -1) {
      jsonOutput = result.stdout.slice(firstBrace);
    }
  }

  console.log(output);

  return { passed, output, jsonOutput };
}

function generateStepReport(scenarioInfo, stepResults, playwrightOutput) {
  const lines = [];
  const scenarioName = scenarioInfo ? scenarioInfo.name : scenario;

  lines.push(`# Rapport de test — ${scenarioName}`);
  lines.push(`Date: ${new Date().toLocaleString("fr-FR")}`);

  let passedCount = stepResults.filter(s => s.passed).length;
  let failedCount = stepResults.filter(s => !s.passed).length;
  const finalStatus = failedCount === 0 ? "✅ PASSÉ" : "❌ ÉCHOUÉ";

  lines.push(`Statut final: ${finalStatus}`);
  lines.push("");
  lines.push("## Étapes du scénario");
  lines.push("");
  lines.push("| # | Étape | Statut | Détail |");
  lines.push("|---|-------|--------|--------|");

  stepResults.forEach((sr, index) => {
    const status = sr.passed ? "✅" : "❌";
    const detail = sr.passed ? "Succès" : (sr.error || "Échoué");
    lines.push(`| ${index + 1} | ${sr.stepName} | ${status} | ${detail} |`);
  });

  lines.push("");
  lines.push(`**Résumé: ${passedCount}/${stepResults.length} étapes réussies, ${failedCount} échecs**`);
  lines.push("");
  lines.push("## Détails des étapes");
  lines.push("");

  stepResults.forEach((sr) => {
    const status = sr.passed ? "✅ PASSÉ" : "❌ ÉCHOUÉ";
    lines.push(`### ${sr.stepId}: ${sr.stepName} — ${status}`);
    if (sr.error) {
      lines.push(`- Erreur: ${sr.error}`);
    }
    lines.push("");
  });

  lines.push("## Analyse des causes");
  lines.push("");

  const failedSteps = stepResults.filter(s => !s.passed);
  if (failedSteps.length > 0) {
    const failedNames = failedSteps.map(s => s.stepName).join(", ");
    lines.push(`Les étapes suivantes ont échoué: ${failedNames}`);
    lines.push("Les causes possibles:");
    lines.push("- Sélecteurs non trouvés dans le code frontend");
    lines.push("- Problème d'authentification");
    lines.push("- Timeout de chargement des pages");
    lines.push("- Erreurs côté backend");
  } else {
    lines.push("Toutes les étapes ont réussi.");
  }

  lines.push("");
  lines.push("## Prochaines étapes");
  lines.push("");
  if (failedSteps.length > 0) {
    lines.push("- Corriger les sélecteurs échoués");
    lines.push("- Revérifier la connexion au backend");
    lines.push("- Relancer le test après correction");
  } else {
    lines.push("Aucune action requise. Test terminé avec succès.");
  }

  return lines.join("\n");
}

async function generateReport(scenarioInfo, stepResults, playwrightOutput) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  let reportContent = generateStepReport(scenarioInfo, stepResults, playwrightOutput);

  const failedSteps = stepResults.filter(s => !s.passed);
  if (failedSteps.length > 0) {
    try {
      const supportingFiles = (scenarioInfo && scenarioInfo.supporting) ? scenarioInfo.supporting : [];
      let sourceCodeContext = "";
      for (const f of supportingFiles) {
        try {
          if (fs.existsSync(f.file)) {
            sourceCodeContext += `\nFILE: ${f.file}\n` + fs.readFileSync(f.file, "utf8") + "\n";
          }
        } catch (_) {}
      }

      const rootCausePrompt = `
Analyze the following test failure for scenario: "${scenarioInfo ? scenarioInfo.name : scenario}"

FAILED PLAYWRIGHT OUTPUT:
${playwrightOutput}

FAILED STEPS / ERRORS:
${failedSteps.map(s => `- ${s.stepName}: ${s.error}`).join("\n")}

SUPPORTING APPLICATION SOURCE CODE:
${sourceCodeContext}

INSTRUCTIONS:
1. Identify the exact source code file (frontend component or backend resolver/model) responsible for or related to this error.
2. Provide the exact line number range and defective code snippet.
3. Provide the exact proposed code solution / fix.
4. Format output strictly in clear Markdown with sections:
   ### 📍 Fichier et Ligne de Code Défectueux
   ### ❌ Extrait du Code en Panne
   ### 💡 Solution de Code Recommandée
`;

      const { text: rootCauseText } = await askBedrockRootCause(rootCausePrompt);
      reportContent += `\n\n## 🎯 Localisation exacte de la panne & Solution de code proposée\n\n${rootCauseText}\n`;
    } catch (err) {
      console.error("Root cause analysis error:", err.message);
    }
  }

  const reportFile = path.join(REPORTS_DIR, `${slug}-report.md`);
  fs.writeFileSync(reportFile, reportContent, "utf8");

  console.log(`\n==========================================`);
  console.log(`RAPPORT SAUVEGARDÉ`);
  console.log(`==========================================`);
  console.log(`→ ${reportFile}`);
  console.log(`\n${reportContent}\n`);
}

async function healTest(currentCode, playwrightErrors, failedSteps) {
  console.log(`
==========================================
STEP 3 — HEALING THE TEST VIA BEDROCK
==========================================
Sending errors to Bedrock for correction...
`);

  const failedStepsText = failedSteps.map(s => `- ${s.stepId}: ${s.stepName} — ${s.error || "Échec"}`).join("\n");

  const fixPrompt = `
You are an expert Playwright test engineer.

The following Playwright test was generated but has errors.
Read the errors and return a corrected version.

Failed steps:
${failedStepsText}

IMPORTANT CONTEXT

- Real frontend login page URL: http://localhost:5173/login
- Devices page (home): http://localhost:5173/
- Company page: http://localhost:5173/company
- Users page: http://localhost:5173/users
- If tests timeout waiting for elements, the page likely requires authentication first.
  Add a login step BEFORE navigating to the protected page:
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder="Entrer email"]', 'saddi.ilyes1@gmail.com');
    await page.fill('input[placeholder="Entrer mot de passe"]', 'ilyes2003');
    await page.click('button.login-btn');
    await page.waitForURL('**/');
- CRITICAL PLAYWRIGHT ASSERTION RULE: expect(page).toHaveSelector DOES NOT EXIST.
  WRONG : await expect(page).toHaveSelector('input[name="name"]', { state: 'hidden' });
  CORRECT: await expect(page.locator('input[name="name"]')).toBeHidden();
  OR     : await page.waitForSelector('input[name="name"]', { state: 'hidden' });
- For OPENING the Create Device modal: use page.click('button.btn-create-device')
- For SUBMITTING the form inside the modal: use page.click('button.btn:has-text("Confirm")')
- NEVER click button.btn-create-device to submit the modal — it is behind the modal overlay.
- For the company dropdown: NEVER select by company name (it is not known).
  Wait for select to be attached, then select index 0:
    await page.waitForSelector('select[name="company_name"]', { state: 'attached' });
    await page.selectOption('select[name="company_name"]', { index: 0 });
- Do not assume create-device modal behavior unless it appears in CURRENT TEST CODE.
- Use only selectors and assertions that are already supported by the current test or by the error output.
- If the failure is about a deletion flow, verify the post-delete state of the delete form instead of reusing a create-form modal assertion.

CURRENT TEST CODE:
${currentCode}

PLAYWRIGHT ERROR OUTPUT:
${playwrightErrors}

INSTRUCTIONS:
- Fix ONLY what the errors indicate.
- Do NOT invent new selectors.
- Keep the same test structure and assertions.
- Return ONLY the raw corrected Playwright test code.
- No markdown fences, no explanations, no section headings.
`;

  const { text } = await askBedrockHeal(fixPrompt);
  return text
    .replace(/^```[a-zA-Z]*\r?\n?/, "")
    .replace(/\r?\n?```$/, "")
    .trim();
}

async function main() {
  console.log(`
==========================================
RUN-AND-HEAL (AWS BEDROCK) — STEP TRACKING
=========================================
Scenario : ${scenario}
Max tries: ${MAX_RETRIES}
Model    : ${process.env.BEDROCK_MODEL_ID || "eu.amazon.nova-micro-v1:0"}
`);

  const scenarioInfo = getScenarioInfo(scenario);
  const scenarioSteps = scenarioInfo ? scenarioInfo.steps : [];

  if (!scenarioInfo) {
    const { suggestScenarios } = require("../scenarios/index");
    const suggestions = suggestScenarios(scenario, 3);
    console.error(`Scénario non trouvé: ${scenario}`);
    console.log("\nScénarios disponibles:");
    const files = fs.readdirSync(path.join(__dirname, "..", "scenarios")).filter(f => f.endsWith(".js") && f !== "index.js");
    files.forEach(f => {
      const s = require(path.join(__dirname, "..", "scenarios", f));
      console.log(`  - ${s.name}`);
    });
    if (suggestions && suggestions.length > 0) {
      console.log("\nVouliez-vous dire ? (copiez une phrase et relancez) :");
      suggestions.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.phrase}`);
      });
    }
    process.exit(1);
  }

  console.log(`\nÉtapes du scénario "${scenarioInfo.name}":`);
  scenarioSteps.forEach((step, i) => {
    console.log(`  ${i + 1}. ${step.name} (${step.id})`);
  });
  console.log("");

  generateTest();

  let finalStepResults = [];

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`
==========================================
ATTEMPT ${attempt} / ${MAX_RETRIES}
===========================================`);

    const { passed, output, jsonOutput } = runPlaywright();

    let stepResults = getStepsFromPlaywrightJson(jsonOutput, scenarioSteps);

    if (!stepResults || stepResults.length === 0) {
      stepResults = getStepResultsFromOutput(output, scenarioSteps);
    }

    if (stepResults.length === 0 && scenarioSteps.length > 0) {
      scenarioSteps.forEach((step) => {
        stepResults.push(trackStep(step.id, step.name, passed));
      });
    }

    finalStepResults = stepResults;

    const passedSteps = stepResults.filter(s => s.passed).length;
    const failedSteps = stepResults.filter(s => !s.passed);

    console.log(`\n${buildStepReport(stepResults)}`);

    if (passed && failedSteps.length === 0) {
      console.log(`
==========================================
✅ TOUTES LES ÉTAPES RÉUSSIES (tentative ${attempt})
==========================================
`);
      await generateReport(scenarioInfo, stepResults, output);
      process.exit(0);
    }

    if (noHeal) {
      console.error(`
==========================================
🔴 TEST EN ÉCHEC (mode --no-heal, aucune réparation)
==========================================
${failedSteps.length} étapes échouées
`);
      await generateReport(scenarioInfo, stepResults, output);
      process.exit(1);
    }

    if (attempt === MAX_RETRIES) {
      console.error(`
==========================================
❌ MAX RETRIES REACHED — ${failedSteps.length} étapes échouées
==========================================
Dernière sortie Playwright:
${output}
`);
      await generateReport(scenarioInfo, stepResults, output);
      process.exit(1);
    }

if (!fs.existsSync(testFile)) {
      console.log("Fichier de test introuvable, régénération...");
      generateTest();
    }
    const currentCode = fs.readFileSync(testFile, "utf8");
    const fixedCode = await healTest(currentCode, output, failedSteps);
    fs.writeFileSync(testFile, fixedCode, "utf8");
    console.log(`\nTest corrigé sauvegardé → ${testFile}\n`);
  }
}

function generateTest() {
  if (fs.existsSync(testFile) && !forceRegenerate) {
    console.log(`
==========================================
STEP 1 — SKIPPING GENERATION (file exists)
==========================================
Using existing: ${testFile}
Tip: run with --fresh to regenerate from scratch.
`);
    return;
  }

  console.log(`
==========================================
STEP 1 — GENERATING TEST VIA BEDROCK
==========================================
Scenario: ${scenario}
`);

  execFileSync(
    "node",
    ["src/test-workflow-context.js", ...scenarioArgs],
    { stdio: "inherit", encoding: "utf8" }
  );

  if (!fs.existsSync(testFile)) {
    throw new Error(`Test file was not created: ${testFile}`);
  }

  console.log(`\nTest file ready: ${testFile}\n`);
}

main().catch((err) => {
  console.error("\n===== FATAL ERROR =====\n", err);
  process.exit(1);
});
