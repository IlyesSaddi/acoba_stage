const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { askBedrock } = require("../services/bedrockService");
// ============================================================
// CONFIGURATION
// ============================================================

const scenario = process.argv.slice(2).join(" ") || "Créer un utilisateur";

const OUTPUT_FILE = path.join(__dirname, "generated-workflow-prompt.txt");

const GENERATED_TESTS_DIR = path.join(__dirname, "generated-tests");

function scenarioToFilename(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ============================================================
// LOAD WORKFLOW ANALYSIS (clean JSON only)
// ============================================================

function loadWorkflowAnalysis() {
  try {
    const output = execFileSync(
      "node",
      ["src/test-workflow-analyzer.js", "--json", scenario],
      {
        encoding: "utf8",
        maxBuffer: 50 * 1024 * 1024
      }
    );

    return JSON.parse(output);
  } catch (error) {
    console.error("Unable to execute workflow analyzer.");
    if (error.stdout) console.error(error.stdout);
    if (error.stderr) console.error(error.stderr);
    console.error(error.message);
    process.exit(1);
  }
}

// ============================================================
// FORMAT HELPERS
// ============================================================

function formatFunctionCode(fn) {
  if (!fn || !fn.code) {
    return "CODE_NOT_AVAILABLE\nOnly the function signature was detected.";
  }
  return fn.code;
}

function formatFunctionBlock(fn) {
  return `
------------------------------------------------------------
FUNCTION
------------------------------------------------------------

Name:
${fn.functionName}

File:
${fn.file}

Workflow role:
${fn.role}

Reason:
${fn.reason}

------------------------------------------------------------
CODE
------------------------------------------------------------

${formatFunctionCode(fn)}
`;
}

function readSupportingFile(file) {
  try {
    return fs.readFileSync(file.file, "utf8");
  } catch {
    return "SOURCE_CODE_NOT_AVAILABLE";
  }
}

function formatSupportingFile(file) {
  return `
------------------------------------------------------------
FILE
------------------------------------------------------------

Name:
${path.basename(file.file)}

Path:
${file.file}

Workflow role:
${file.role}

Reason:
${file.reason}

------------------------------------------------------------
CODE
------------------------------------------------------------

${readSupportingFile(file)}
`;
}

function buildWorkflowSummary(analysis) {
  if (analysis && analysis.workflowDescription) {
    return analysis.workflowDescription;
  }
  return `No workflow description available.`;
}

function buildMainTestInstructions(analysis) {
  const intentAction = analysis?.intent?.action || "unknown";
  const intentEntity = analysis?.intent?.entity || "unknown";

  if (intentAction === "delete" && intentEntity === "device") {
    return `The main test must:

1. Open the real frontend entry point if known.
2. Log in with the verified credentials.
3. Go to the devices home page.
4. Register the confirmation dialog listener.
5. Fill the device name using a verified selector.
6. Click the verified delete button.
7. Verify the deletion flow by checking that the deleted device heading/card is removed from the list.
8. Do NOT invent a hidden modal assertion from create flows.
9. Use only verified selectors from the provided source code.
10. Prefer a real device name already present in the list over a placeholder like TestDevice.`;
  }

  return `The main test must:

1. Follow the workflow summary from the provided source code.
2. Use only verified selectors.
3. Do not invent routes, selectors, or assertions not supported by the source.
4. Make the final assertion consistent with the actual UI state after the main action.`;
}

// ============================================================
// EXTRACT VERIFIED SELECTORS FROM FRONTEND SOURCE
// ============================================================

function extractFrontendSelectors(supporting) {
  const selectors = [];

  for (const file of supporting) {
    const code = readSupportingFile(file);
    if (!code) continue;

    // --- input placeholders ---
    const placeholders = [...code.matchAll(/placeholder=["']([^"']+)["']/g)];
    for (const m of placeholders) {
      selectors.push(`input[placeholder="${m[1]}"]`);
    }

    // --- button classes ---
    const btnClasses = [...code.matchAll(/className=["']([^"']*btn[^"']*)["']/gi)];
    for (const m of btnClasses) {
      for (const cls of m[1].trim().split(/\s+/)) {
        if (cls) selectors.push(`button.${cls}`);
      }
    }

    // --- p / div message classes ---
    const msgClasses = [...code.matchAll(/className=["']([^"']*message[^"']*)["']/gi)];
    for (const m of msgClasses) {
      for (const cls of m[1].trim().split(/\s+/)) {
        if (cls) selectors.push(`p.${cls}`);
      }
    }

    // --- fetch / axios URLs ---
    const urls = [...code.matchAll(/['"`](https?:\/\/[^'"`]+)['"`]/g)];
    for (const m of urls) {
      selectors.push(`ENDPOINT: ${m[1]}`);
    }

    // --- button text literals ---
    const btnTexts = [...code.matchAll(/<button[^>]*>([^<{]+)<\/button>/g)];
    for (const m of btnTexts) {
      const text = m[1].trim();
      if (text) selectors.push(`button with text: "${text}"`);
    }

    // --- JSX ternary button labels (isLogin ? 'A' : 'B') ---
    const ternaryTexts = [...code.matchAll(/['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g)];
    for (const m of ternaryTexts) {
      selectors.push(`button label option: "${m[1]}" or "${m[2]}"`);
    }
  }

  // Deduplicate
  return [...new Set(selectors)];
}

// ============================================================
// BUILD PROMPT
// ============================================================

function buildPrompt(analysis) {
  const main = analysis.detectedFunctions.main || [];
  const postCreation = analysis.detectedFunctions.postCreation || [];
  const alternative = analysis.detectedFunctions.alternative || [];
  const unrelated = analysis.detectedFunctions.unrelated || [];
  const supporting = analysis.classifiedFiles.supporting || [];

  const hasEmailMechanism = supporting.some(
    (file) =>
      file.code &&
      (file.code.includes("mailtrap") ||
        file.code.includes("smtp") ||
        file.code.includes("imap") ||
        file.code.includes("email testing"))
  );

  return `
You are an expert software test engineer.

Your task is to generate a deterministic automated end-to-end
regression test for an EXISTING application.

============================================================
USER REQUEST
============================================================

${analysis.scenario}

============================================================
INTENT
============================================================

Action:
${analysis.intent.action}

Entity:
${analysis.intent.entity}

============================================================
SOURCE OF TRUTH
============================================================

The workflow classification produced by the source-code
analyzer is authoritative.

Do NOT invent:

- selectors
- routes
- URLs
- API endpoints
- database behavior
- email interfaces
- confirmation tokens
- test infrastructure
- application behavior

============================================================
MAIN WORKFLOW
============================================================

${main.length ? main.map(formatFunctionBlock).join("\n") : "No main workflow detected."}

============================================================
POST-CREATION CONFIRMATION
============================================================

${
  postCreation.length
    ? postCreation.map(formatFunctionBlock).join("\n")
    : "No post-creation confirmation detected."
}

============================================================
ALTERNATIVE WORKFLOW
============================================================

${
  alternative.length
    ? alternative.map(formatFunctionBlock).join("\n")
    : "No alternative workflow detected."
}

IMPORTANT:

The alternative workflow MUST NOT be executed in the main
happy-path test.

============================================================
UNRELATED FUNCTIONS
============================================================

${
  unrelated.length
    ? unrelated
        .map(
          (fn) => `
- ${fn.functionName}
  File: ${fn.file}
  Reason: ${fn.reason}
`
        )
        .join("\n")
    : "No unrelated functions detected."
}

IMPORTANT:

Unrelated functions MUST NOT be executed.

============================================================
SUPPORTING SOURCE CODE
============================================================

${
  supporting.length
    ? supporting.map(formatSupportingFile).join("\n")
    : "No supporting files available."
}

============================================================
BUSINESS WORKFLOW
============================================================

${buildWorkflowSummary(analysis)}

============================================================
FRONTEND ENTRY POINT
============================================================

The frontend runs at: http://localhost:5173

============================================================
VERIFIED SELECTORS
============================================================

The following selectors were extracted automatically from the
frontend source code. Use ONLY these selectors. Do NOT invent
any other selector.

${extractFrontendSelectors(supporting).map(s => `- ${s}`).join("\n")}

============================================================
GRAPHQL
============================================================

Use the GraphQL endpoint only if the frontend source code
explicitly proves its URL. Do not invent endpoints.

============================================================
EMAIL
============================================================

The application sends a confirmation email. However, no
deterministic email-testing mechanism is assumed to exist.

EMAIL_TEST_MECHANISM_PROVIDED:
${hasEmailMechanism ? "YES" : "NO"}

If no test email mechanism is provided, output:

EMAIL_TEST_MECHANISM_NOT_PROVIDED

Do NOT automate Gmail or another imaginary inbox.
Do NOT invent a confirmation token.

============================================================
MAIN TEST
============================================================

${buildMainTestInstructions(analysis)}

The test may cover confirmation only if a deterministic
confirmation mechanism is actually available from the
provided source code. Otherwise report
EMAIL_TEST_MECHANISM_NOT_PROVIDED.

============================================================
ERROR SCENARIOS
============================================================

Describe separately:

1. Existing email. Expected backend error: User already exists
2. Missing confirmation email. Use resendConfirmationEmail only
   in a separate recovery test.
3. Invalid confirmation token. Expected backend error:
   Invalid token

Do NOT execute these scenarios inside the main happy path.

============================================================
OUTPUT FORMAT
============================================================

Your response MUST contain ONLY the raw Playwright test code.

Do NOT include any of the following:

- Section headings (# 1. WORKFLOW ANALYSIS, etc.)
- Markdown code fences (triple backticks)
- Analysis text
- Scenario descriptions
- Tables
- Explanations

Return ONLY:

- import statements
- test.describe / test blocks
- page actions
- assertions
- short inline comments if useful

Nothing before the code. Nothing after the code.

============================================================
FINAL RULE
============================================================

The provided source code is the only source of truth.
If information is missing: STATE IT. Never guess.
`;
}

// ============================================================
// DISPLAY
// ============================================================

function displayWorkflow(analysis) {
  const main = analysis.detectedFunctions.main || [];
  const postCreation = analysis.detectedFunctions.postCreation || [];
  const alternative = analysis.detectedFunctions.alternative || [];
  const unrelated = analysis.detectedFunctions.unrelated || [];

  console.log(`
==========================================
WORKFLOW CONTEXT
==========================================

Scenario:
${analysis.scenario}

==========================================
MAIN WORKFLOW
==========================================
`);

  if (main.length === 0) {
    console.log("No main workflow detected.");
  } else {
    main.forEach((fn, index) => {
      console.log(`
${index + 1}. ${fn.functionName}
   File: ${fn.file}
   Type: ${fn.role}

   ${fn.reason}
`);
    });
  }

  console.log(`
==========================================
POST-CREATION CONFIRMATION
==========================================
`);

  if (postCreation.length === 0) {
    console.log("No confirmation operation detected.");
  } else {
    postCreation.forEach((fn) => {
      console.log(`
${fn.functionName}
   File: ${fn.file}
   Type: ${fn.role}

   ${fn.reason}
`);
    });
  }

  console.log(`
==========================================
ALTERNATIVE WORKFLOW
==========================================
`);

  if (alternative.length === 0) {
    console.log("No alternative workflow detected.");
  } else {
    alternative.forEach((fn) => {
      console.log(`
- ${fn.functionName}
  File: ${fn.file}
  Type: ${fn.role}

  ${fn.reason}
`);
    });
  }

  console.log(`
==========================================
UNRELATED FUNCTIONS
==========================================
`);

  if (unrelated.length === 0) {
    console.log("No unrelated functions detected.");
  } else {
    unrelated.forEach((fn) => {
      console.log(`
- ${fn.functionName}
  File: ${fn.file}
  Reason: ${fn.reason}
`);
    });
  }
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const analysis = loadWorkflowAnalysis();

  displayWorkflow(analysis);

  const prompt = buildPrompt(analysis);

  fs.writeFileSync(OUTPUT_FILE, prompt, "utf8");
    console.log(`
==========================================
SENDING CONTEXT TO BEDROCK
==========================================
`);

  try {
    const bedrockResult = await askBedrock(prompt);
    const response = bedrockResult.text;

    // Track token usage for summary
    global.__bedrockTokens = {
      inputTokens: bedrockResult.inputTokens,
      outputTokens: bedrockResult.outputTokens,
      totalTokens: bedrockResult.totalTokens,
      durationMs: bedrockResult.durationMs
    };

    // Save the generated test to a .spec.js file
    if (!fs.existsSync(GENERATED_TESTS_DIR)) {
      fs.mkdirSync(GENERATED_TESTS_DIR, { recursive: true });
    }
    const slug = scenarioToFilename(scenario);
    const testFile = path.join(GENERATED_TESTS_DIR, `${slug}.spec.js`);

    // Strip markdown fences if the LLM wrapped the code (e.g. ```javascript ... ```)
    const cleanResponse = response
      .replace(/^```[a-zA-Z]*\r?\n?/, "")
      .replace(/\r?\n?```$/, "")
      .trim();

    fs.writeFileSync(testFile, cleanResponse, "utf8");


    console.log(`
==========================================
BEDROCK GENERATED TEST
==========================================

${response}

==========================================
TEST SAVED
==========================================

${testFile}
`);
  } catch (error) {
    console.error("\n===== BEDROCK ERROR =====\n");
    console.error(error);
  }

  console.log(`
==========================================
LLM PROMPT
==========================================

${prompt}

==========================================
PROMPT SAVED
==========================================

${OUTPUT_FILE}
`);
}

main();
