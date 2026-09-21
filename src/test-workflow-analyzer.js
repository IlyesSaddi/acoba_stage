const fs   = require("fs");
const path = require("path");
const { findScenario } = require("../scenarios/index");

// ============================================================
// CONFIGURATION
// ============================================================

const args         = process.argv.slice(2);
const jsonMode     = args.includes("--json") || process.env.JSON_OUTPUT === "1";
const scenarioArgs = args.filter(a => a !== "--json");
const scenarioText = scenarioArgs.join(" ") || "Créer un utilisateur";

// ============================================================
// PROJECT PATHS
// ============================================================

const PROJECT_ROOT  = "/home/ilyess/web - Devops/Acoba";
const BACKEND_ROOT  = path.join(PROJECT_ROOT, "Backend_stage2025");
const FRONTEND_ROOT = path.join(PROJECT_ROOT, "Frontend_stage2025");

// ============================================================
// FILE HELPERS
// ============================================================

function readFile(filePath) {
  try {
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  } catch {
    return "";
  }
}

// ============================================================
// EXTRACT FUNCTION BODY (brace-aware, paren-aware)
// ============================================================

function extractFunctionCode(code, functionName) {
  if (!code || !functionName) return "";

  const objectPattern = new RegExp(`\\b${functionName}\\s*:\\s*async\\s*\\(`, "m");
  const fnPattern     = new RegExp(`\\bfunction\\s+${functionName}\\s*\\(`, "m");

  const objectMatch = objectPattern.exec(code);
  const fnMatch     = objectMatch ? null : fnPattern.exec(code);
  const match       = objectMatch || fnMatch;
  if (!match) return "";

  const start    = match.index;
  let parenOpen  = code.indexOf("(", start);
  if (parenOpen === -1) return code.substring(start, start + 500);

  let depth = 0, inString = false, stringChar = null, escaped = false, i = parenOpen;
  for (; i < code.length; i++) {
    const c = code[i];
    if (escaped)              { escaped = false; continue; }
    if (inString)             { if (c === "\\") escaped = true; else if (c === stringChar) inString = false; continue; }
    if (c === '"' || c === "'" || c === "`") { inString = true; stringChar = c; continue; }
    if (c === "(") depth++;
    else if (c === ")") { depth--; if (depth === 0) { i++; break; } }
  }

  const braceStart = code.indexOf("{", i);
  if (braceStart === -1) return code.substring(start, start + 500);

  let bDepth = 0, bInStr = false, bStrChar = null, bEsc = false;
  for (let j = braceStart; j < code.length; j++) {
    const c = code[j];
    if (bEsc)              { bEsc = false; continue; }
    if (bInStr)            { if (c === "\\") bEsc = true; else if (c === bStrChar) bInStr = false; continue; }
    if (c === '"' || c === "'" || c === "`") { bInStr = true; bStrChar = c; continue; }
    if (c === "{") bDepth++;
    else if (c === "}") { bDepth--; if (bDepth === 0) return code.substring(start, j + 1); }
  }
  return code.substring(start);
}

// ============================================================
// RESOLVE A SUPPORTING FILE PATH
// ============================================================

function resolveSupportingFile(fileKey) {
  if (fileKey.startsWith("frontend/")) {
    const name = fileKey.replace("frontend/", "");
    return path.join(FRONTEND_ROOT, "src", "components", name);
  }
  return path.join(BACKEND_ROOT, fileKey);
}

// ============================================================
// MAIN
// ============================================================

const config = findScenario(scenarioText);

if (!config) {
  console.error(`No scenario found for: "${scenarioText}"`);
  console.error("Available scenarios:");
  const { scenarios } = require("../scenarios/index");
  scenarios.forEach(s => console.error(`  - ${s.name} (keywords: ${s.keywords.join(", ")})`));
  process.exit(1);
}

// Read the resolver file
const resolverPath = path.join(BACKEND_ROOT, "graphql", "resolvers", config.resolverFile);
const resolverCode = readFile(resolverPath);

// Build detectedFunctions
const detectedFunctions = { main: [], postCreation: [], alternative: [], unrelated: [], unknown: [] };

for (const [category, items] of Object.entries(config.functions)) {
  if (!detectedFunctions[category]) continue;

  // items can be strings or objects
  const list = Array.isArray(items) ? items : [];

  for (const item of list) {
    const fnName  = typeof item === "string" ? item : item.functionName;
    const role    = typeof item === "object"  ? item.role   : category.toUpperCase();
    const reason  = typeof item === "object"  ? item.reason : "";
    const code    = extractFunctionCode(resolverCode, fnName);

    detectedFunctions[category].push({
      functionName: fnName,
      file:         resolverPath,
      role,
      reason,
      code
    });
  }
}

// Build classifiedFiles
const classifiedFiles = {
  main:        (config.functions.main        || []).map(item => ({ file: resolverPath, functionName: typeof item === "string" ? item : item.functionName, role: "MAIN WORKFLOW",           reason: typeof item === "object" ? item.reason : "" })),
  postCreation:(config.functions.postCreation|| []).map(item => ({ file: resolverPath, functionName: typeof item === "string" ? item : item.functionName, role: "POST-CREATION",            reason: typeof item === "object" ? item.reason : "" })),
  alternative: (config.functions.alternative || []).map(item => ({ file: resolverPath, functionName: typeof item === "string" ? item : item.functionName, role: "ALTERNATIVE WORKFLOW",     reason: typeof item === "object" ? item.reason : "" })),
  unrelated:   (config.functions.unrelated   || []).map(item => ({ file: resolverPath, functionName: typeof item === "string" ? item : item.functionName, role: "UNRELATED",                reason: typeof item === "object" ? item.reason : "" })),
  supporting:  (config.supporting            || []).map(s => ({
    file:   resolveSupportingFile(s.file),
    role:   s.role,
    reason: s.reason
  }))
};

// Intent
const intent = { action: "unknown", entity: "unknown" };
const norm = scenarioText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
if (norm.includes("creer") || norm.includes("ajouter") || norm.includes("create") || norm.includes("add"))   intent.action = "create";
if (norm.includes("supprimer") || norm.includes("delete") || norm.includes("remove"))                         intent.action = "delete";
if (norm.includes("modifier") || norm.includes("update") || norm.includes("edit"))                            intent.action = "update";
if (norm.includes("login") || norm.includes("connexion") || norm.includes("authenticate"))                    intent.action = "authenticate";
if (norm.includes("reset") || norm.includes("reinitialiser") || norm.includes("mot de passe"))                intent.action = "reset";
if (norm.includes("utilisateur") || norm.includes("user"))     intent.entity = "user";
if (norm.includes("entreprise") || norm.includes("company"))   intent.entity = "company";
if (norm.includes("device") || norm.includes("appareil"))      intent.entity = "device";

const result = {
  scenario:           config.name,
  intent,
  detectedFunctions,
  classifiedFiles,
  workflowRules: {
    main:        (config.functions.main        || []).map(i => typeof i === "string" ? i : i.functionName),
    postCreation:(config.functions.postCreation|| []).map(i => typeof i === "string" ? i : i.functionName),
    alternative: (config.functions.alternative || []).map(i => typeof i === "string" ? i : i.functionName),
    unrelated:   (config.functions.unrelated   || []).map(i => typeof i === "string" ? i : i.functionName)
  },
  // Pass the workflow description through for use by context builder
  workflowDescription: config.workflow || ""
};

// ============================================================
// OUTPUT
// ============================================================

if (jsonMode) {
  process.stdout.write(JSON.stringify(result, null, 2));
  process.exit(0);
}

// Human output
console.log(`\n==========================================\nWORKFLOW ANALYZER\n==========================================\nScenario: ${config.name}\nIntent  : ${intent.action} / ${intent.entity}\n`);
console.log("MAIN FUNCTIONS:");
detectedFunctions.main.forEach(f => console.log(`  - ${f.functionName}`));
console.log("\nSUPPORTING FILES:");
classifiedFiles.supporting.forEach(f => console.log(`  - ${f.file}`));
console.log("\n==========================================\nANALYZER RESULT\n==========================================");
console.log(JSON.stringify(result, null, 2));
