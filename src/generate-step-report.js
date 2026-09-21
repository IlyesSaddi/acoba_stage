require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { getScenarioInfo } = require("./step-tracker");

const args = process.argv.slice(2);
const scenario = args.join(" ") || "Créer un device";
const scenarioInfo = getScenarioInfo(scenario);

if (!scenarioInfo) {
  console.error(`Scénario non trouvé: ${scenario}`);
  console.log("\nScénarios disponibles:");
  const files = fs.readdirSync(path.join(__dirname, "..", "scenarios")).filter(f => f.endsWith(".js") && f !== "index.js");
  files.forEach(f => {
    const s = require(path.join(__dirname, "..", "scenarios", f));
    console.log(`  - ${s.name}`);
  });
  process.exit(1);
}

console.log(`\n==========================================`);
console.log(`ÉTAPES DU SCÉNARIO: ${scenarioInfo.name}`);
console.log(`==========================================\n`);

scenarioInfo.steps.forEach((step, index) => {
  console.log(`  ${index + 1}. [${step.id}] ${step.name}`);
  console.log(`     Action: ${step.action}`);
  console.log("");
});

console.log(`==========================================`);
console.log(`Nombre total d'étapes: ${scenarioInfo.steps.length}`);
console.log(`==========================================\n`);

console.log("Pour générer un rapport détaillé après exécution:");
console.log(`  node src/run-and-heal.js "${scenario}"`);
console.log("");
