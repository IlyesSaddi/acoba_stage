const fs = require("fs");
const path = require("path");

const scenariosDir = path.join(__dirname, "..", "scenarios");
const { findScenario: fuzzyFindScenario } = require("../scenarios/index");

function loadScenario(scenarioName) {
  const scenarioPath = path.join(scenariosDir, `${scenarioName}.js`);
  if (!fs.existsSync(scenarioPath)) {
    return null;
  }
  return require(scenarioPath);
}

function findScenarioFile(name) {
  const matched = fuzzyFindScenario(name);
  if (!matched) return null;

  const files = fs.readdirSync(scenariosDir).filter(f => f.endsWith(".js") && f !== "index.js");
  for (const file of files) {
    const scenario = require(path.join(scenariosDir, file));
    if (scenario.name === matched.name) {
      return { file: file.replace(".js", ""), scenario };
    }
  }
  return null;
}

function getSteps(scenarioName) {
  const result = findScenarioFile(scenarioName);
  if (!result) {
    return null;
  }
  return result.scenario.steps || [];
}

function getScenarioInfo(scenarioName) {
  const result = findScenarioFile(scenarioName);
  if (!result) {
    return null;
  }
  const { scenario } = result;
  return {
    name: scenario.name,
    steps: scenario.steps || [],
    functions: scenario.functions || {},
    file: result.file
  };
}

function buildStepReport(stepResults) {
  const lines = [];
  lines.push("");
  lines.push("==========================================");
  lines.push("RAPPORT ÉTAPE PAR ÉTAPE");
  lines.push("==========================================");

  let totalSteps = stepResults.length;
  let passedCount = 0;
  let failedCount = 0;

  for (const stepResult of stepResults) {
    const status = stepResult.passed ? "✅ PASSÉ" : "❌ ÉCHOUÉ";
    const error = stepResult.error ? `\n   Erreur: ${stepResult.error}` : "";
    lines.push(`  ${stepResult.stepId} — ${stepResult.stepName}: ${status}${error}`);
    if (stepResult.passed) {
      passedCount++;
    } else {
      failedCount++;
    }
  }

  lines.push("");
  lines.push(`==========================================`);
  lines.push(`RÉSUMÉ: ${passedCount}/${totalSteps} étapes réussies, ${failedCount} échecs`);
  lines.push(`==========================================`);

  return lines.join("\n");
}

function trackStep(stepId, stepName, passed, error = null) {
  return {
    stepId,
    stepName,
    passed,
    error,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  loadScenario,
  findScenarioFile,
  getSteps,
  getScenarioInfo,
  buildStepReport,
  trackStep
};
