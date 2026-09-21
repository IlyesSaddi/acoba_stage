require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { generateTest } = require("./llm-client");

async function main() {
  console.log("==========================================");
  console.log("AI TEST GENERATOR");
  console.log("==========================================");

  const promptPath = path.join(
    __dirname,
    "generated-workflow-prompt.txt"
  );

  const outputDir = path.join(
    __dirname,
    "generated-tests"
  );

  const outputPath = path.join(
    outputDir,
    "create-user.spec.js"
  );

  // Vérifier que le prompt existe
  if (!fs.existsSync(promptPath)) {
    throw new Error(
      `Prompt file not found: ${promptPath}`
    );
  }

  // Lire le prompt
  const prompt = fs.readFileSync(
    promptPath,
    "utf8"
  );

  console.log(`\nPrompt loaded:`);
  console.log(promptPath);

  console.log(
    `\nPrompt size: ${prompt.length} characters`
  );

  console.log("\nSending prompt to LLM...");

  // Appel du LLM + timing
  const llmStart = performance.now();
  const generatedTest = await generateTest(prompt);
  const llmEnd = performance.now();
  const llmDurationMs = llmEnd - llmStart;
  const llmDurationSec = (llmDurationMs / 1000).toFixed(2);

  if (!generatedTest || generatedTest.trim().length === 0) {
    throw new Error(
      "LLM returned an empty test."
    );
  }

  // Créer le dossier si nécessaire
  fs.mkdirSync(outputDir, {
    recursive: true
  });

  // Nettoyer éventuellement les markdown fences
  const cleanedTest = cleanGeneratedCode(
    generatedTest
  );

  // Sauvegarder le test
  fs.writeFileSync(
    outputPath,
    cleanedTest,
    "utf8"
  );

  console.log("\n==========================================");
  console.log("TEST GENERATED");
  console.log("==========================================");

  console.log(`\nOutput: ${outputPath}`);
  console.log(`Size: ${cleanedTest.length} characters`);

  console.log(`\nLLM provider: ${process.env.LLM_PROVIDER || "mock"}`);
  console.log(`LLM generation time: ${llmDurationMs.toFixed(0)} ms (${llmDurationSec}s)`);

  console.log("\nGeneration completed successfully.");
}

function cleanGeneratedCode(code) {
  let result = code.trim();

  // Extract Playwright test code from the LLM response.
  // The LLM may wrap the test in markdown fences or surround it
  // with analysis text. We find the code block that contains
  // actual Playwright code (import { test, test.describe, etc.)

  // Find all fenced code blocks: ``` ... ```
  const codeBlockRegex = /```(?:javascript|js|ts|typescript)?\s*\n([\s\S]*?)```/g;

  const blocks = [];
  let match;

  while ((match = codeBlockRegex.exec(result)) !== null) {
    blocks.push(match[1].trim());
  }

  if (blocks.length === 1) {
    // Single code block — use it directly
    return blocks[0];
  }

  if (blocks.length > 1) {
    // Multiple blocks — find the one with Playwright test code
    const playwrightBlock = blocks.find(
      (b) =>
        b.includes("import { test") ||
        b.includes("import {test") ||
        b.includes("test.describe") ||
        b.includes("test('") ||
        b.includes('test("')
    );

    if (playwrightBlock) {
      return playwrightBlock;
    }

    // Fallback: use the last block (often the final code)
    return blocks[blocks.length - 1];
  }

  // No code blocks found — the LLM returned raw code directly.
  // Check if it starts with import and looks like valid JS/TS.
  if (
    result.includes("import {") ||
    result.includes("test.describe") ||
    result.includes("test('")
  ) {
    return result;
  }

  // Last resort: return as-is
  return result;
}

main().catch((error) => {
  console.error("\n==========================================");
  console.error("GENERATOR ERROR");
  console.error("==========================================");

  console.error(
    `\n${error.message}`
  );

  if (process.env.LLM_PROVIDER === "groq") {
    console.error(
      "\nCheck:"
    );

    console.error(
      "1. GROQ_API_KEY exists in .env"
    );

    console.error(
      "2. The Groq API key is valid"
    );

    console.error(
      "3. Your internet connection works"
    );
  }

  process.exit(1);
});