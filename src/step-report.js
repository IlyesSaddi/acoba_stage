require("dotenv").config();
const fs = require("fs");
const path = require("path");

const { getScenarioInfo } = require("./step-tracker");

const args = process.argv.slice(2);
const command = args[0];
const scenarioName = args.slice(1).join(" ") || "Créer un device";

const scenarioInfo = getScenarioInfo(scenarioName);

if (!scenarioInfo) {
  console.error(`Scénario non trouvé: ${scenarioName}`);
  process.exit(1);
}

const steps = scenarioInfo.steps;

if (command === "list") {
  console.log(`\n==========================================`);
  console.log(`SCÉNARIO: ${scenarioInfo.name}`);
  console.log(`==========================================\n`);
  steps.forEach((step, i) => {
    console.log(`  Étape ${i + 1}: ${step.name} (${step.id})`);
    console.log(`    → ${step.action}`);
  });
  console.log(`\nTotal: ${steps.length} étapes`);
} else if (command === "report") {
  const resultsFile = path.join(__dirname, "..", "test-results", ".last-run.json");
  let stepResults = [];

  if (fs.existsSync(resultsFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(resultsFile, "utf8"));
      stepResults = data.stepResults || [];
    } catch (e) {
      console.log("Impossible de lire les résultats précédents.");
    }
  }

  if (stepResults.length === 0) {
    stepResults = steps.map(s => ({ stepId: s.id, stepName: s.name, passed: null, error: null }));
  }

  const report = generateMarkdownReport(scenarioInfo.name, steps, stepResults);
  const reportDir = path.join(__dirname, "..", "test-reports");
  fs.mkdirSync(reportDir, { recursive: true });
  const reportFile = path.join(reportDir, `${scenarioName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-steps-report.md`);
  fs.writeFileSync(reportFile, report, "utf8");
  console.log(`\nRapport généré: ${reportFile}`);
  console.log(report);
} else {
  console.log(`
Usage:
  node src/step-report.js list "${scenarioName}"
  node src/step-report.js report "${scenarioName}"

Examples:
  node src/step-report.js list "Créer un device"
  node src/step-report.js report "Créer un device"
`);
}

function generateMarkdownReport(scenarioName, steps, stepResults) {
  const lines = [];
  const passed = stepResults.filter(s => s.passed === true).length;
  const failed = stepResults.filter(s => s.passed === false).length;
  const pending = stepResults.filter(s => s.passed === null).length;
  const total = steps.length;

  lines.push(`# Rapport d'étapes — ${scenarioName}`);
  lines.push(`Date: ${new Date().toLocaleString("fr-FR")}`);
  lines.push(`Nombre d'étapes: ${total}`);
  lines.push(`Réussi: ${passed} | Échoué: ${failed} | En attente: ${pending}`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Détail des étapes");
  lines.push("");
  lines.push("| # | ID | Étape | Statut |");
  lines.push("|---|-----|-------|--------|");

  steps.forEach((step, i) => {
    const result = stepResults.find(r => r.stepId === step.id);
    let status = "⏳";
    if (result && result.passed === true) status = "✅";
    if (result && result.passed === false) status = "❌";
    const detail = result ? (result.passed ? "Succès" : (result.error || "Échoué")) : "Non exécuté";
    lines.push(`| ${i + 1} | ${step.id} | ${step.name} | ${status} ${detail} |`);
  });

  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Actions par étape");
  lines.push("");

  steps.forEach((step, i) => {
    lines.push(`### ${i + 1}. ${step.name} (${step.id})`);
    lines.push(`\`\`\`\`\`\`\`javascript`);
    lines.push(step.action);
    lines.push("\`\`\`\`\`\`\`");
    lines.push("");
  });

  lines.push("---");
  lines.push("");
  lines.push("## Résumé");
  lines.push("");
  if (failed > 0) {
    const failedSteps = stepResults.filter(s => s.passed === false);
    lines.push(`❌ ${failed} étape(s) échouée(s): ${failedSteps.map(s => s.stepName).join(", ")}`);
  } else if (passed === total) {
    lines.push(`✅ Toutes les ${total} étapes ont réussi.`);
  } else {
    lines.push(`⚠️ ${pending} étape(s) en attente de vérification.`);
  }
  lines.push("");

  return lines.join("\n");
}
