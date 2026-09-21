require("dotenv").config();

const fs = require("fs");
const path = require("path");
const Groq = require("groq-sdk");

// ============================================================
// CONFIGURATION
// ============================================================

const PROMPT_PATH = path.join(
  __dirname,
  "generated-workflow-prompt.txt"
);

const MODELS = [
  {
    id: "openai/gpt-oss-20b",
    label: "GPT-OSS 20B"
  },
  {
    id: "openai/gpt-oss-120b",
    label: "GPT-OSS 120B"
  },
  {
    id: "qwen/qwen3.8-27b",
    label: "Qwen 3.8 27B"
  },
  {
    id: "qwen/qwen3.6-27b",
    label: "Qwen 3.6 27B"
  }
];

const SYSTEM_PROMPT =
  "You are an expert software test engineer. You output ONLY raw Playwright test code. No markdown fences, no section headings, no analysis text, no explanations. Only import statements, test blocks, page actions, assertions, and short inline comments.";

// ============================================================
// LOAD PROMPT
// ============================================================

if (!fs.existsSync(PROMPT_PATH)) {
  console.error(
    `Prompt file not found: ${PROMPT_PATH}`
  );
  console.error(
    "Run test-workflow-context.js first to generate it."
  );
  process.exit(1);
}

const prompt = fs.readFileSync(PROMPT_PATH, "utf8");

console.log("==========================================");
console.log("TOKEN & PERFORMANCE MEASUREMENT");
console.log("==========================================\n");

console.log(`Prompt loaded: ${PROMPT_PATH}`);
console.log(`Prompt size: ${prompt.length} characters`);
console.log(
  `Prompt estimated tokens: ~${Math.ceil(prompt.length / 4)}`
);
console.log(`Models to test: ${MODELS.length}`);
console.log("");

// ============================================================
// GROQ CLIENT
// ============================================================

if (!process.env.GROQ_API_KEY) {
  console.error(
    "GROQ_API_KEY is missing. Check your .env file."
  );
  process.exit(1);
}

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// ============================================================
// TEST ONE MODEL
// ============================================================

async function testModel(model) {
  console.log(`Testing: ${model.label} (${model.id})...`);

  const start = performance.now();

  try {
    const completion =
      await client.chat.completions.create({
        model: model.id,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
        temperature: 0
      });

    const end = performance.now();
    const durationMs = end - start;

    const choice = completion.choices?.[0];
    const usage = completion.usage;

    const result = {
      model: model.label,
      modelId: model.id,
      inputTokens: usage?.prompt_tokens || 0,
      outputTokens: usage?.completion_tokens || 0,
      totalTokens: usage?.total_tokens || 0,
      finishReason: choice?.finish_reason || "unknown",
      durationMs: Math.round(durationMs),
      durationSec: (durationMs / 1000).toFixed(2),
      responseLength:
        choice?.message?.content?.length || 0
    };

    console.log(`  Done in ${result.durationSec}s`);
    console.log(
      `  Tokens: ${result.inputTokens} in / ${result.outputTokens} out / ${result.totalTokens} total`
    );
    console.log(
      `  Finish reason: ${result.finishReason}`
    );
    console.log(
      `  Response: ${result.responseLength} chars`
    );
    console.log("");

    return result;
  } catch (error) {
    const end = performance.now();
    console.log(`  ERROR: ${error.message}`);
    console.log("");

    return {
      model: model.label,
      modelId: model.id,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      finishReason: "error",
      durationMs: Math.round(end - start),
      durationSec: ((end - start) / 1000).toFixed(2),
      responseLength: 0,
      error: error.message
    };
  }
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const results = [];

  for (const model of MODELS) {
    const result = await testModel(model);
    results.push(result);
  }

  // ============================================================
  // OUTPUT TABLE (copy-paste ready)
  // ============================================================

  console.log("==========================================");
  console.log("RESULTS TABLE (copy to Google Docs)");
  console.log("==========================================\n");

  // Header
  const header = [
    "Modèle",
    "Input Tokens",
    "Output Tokens",
    "Total Tokens",
    "Finish Reason",
    "Durée (s)",
    "Réponse (chars)",
    "Statut"
  ];

  // Rows
  const rows = results.map((r) => [
    r.model,
    String(r.inputTokens),
    String(r.outputTokens),
    String(r.totalTokens),
    r.finishReason,
    r.durationSec,
    String(r.responseLength),
    r.error ? `ERREUR: ${r.error}` : r.finishReason === "length" ? "TRONQUÉ" : "OK"
  ]);

  // Calculate column widths
  const colWidths = header.map((h, i) =>
    Math.max(
      h.length,
      ...rows.map((r) => r[i].length)
    )
  );

  // Print header
  const headerLine = header
    .map((h, i) => h.padEnd(colWidths[i]))
    .join(" | ");

  const separator = colWidths
    .map((w) => "-".repeat(w))
    .join(" | ");

  console.log(headerLine);
  console.log(separator);

  // Print rows
  for (const row of rows) {
    const line = row
      .map((cell, i) => cell.padEnd(colWidths[i]))
      .join(" | ");
    console.log(line);
  }

  console.log("");

  // ============================================================
  // COPY-PASTE BLOCK
  // ============================================================

  console.log("==========================================");
  console.log("GOOGLE DOCS (tab-separated)");
  console.log("==========================================\n");

  // Tab-separated for Google Docs paste
  console.log(header.join("\t"));
  for (const row of rows) {
    console.log(row.join("\t"));
  }

  console.log("");

  // ============================================================
  // ANALYSIS
  // ============================================================

  console.log("==========================================");
  console.log("ANALYSIS");
  console.log("==========================================\n");

  for (const r of results) {
    console.log(`${r.model}:`);
    console.log(
      `  Input:    ${r.inputTokens} tokens`
    );
    console.log(
      `  Output:   ${r.outputTokens} tokens`
    );
    console.log(
      `  Total:    ${r.totalTokens} tokens`
    );
    console.log(
      `  Duration: ${r.durationSec}s`
    );

    if (r.finishReason === "length") {
      console.log(
        `  ⚠️  TRONQUÉ: la réponse a été coupée par la limite max_tokens du modèle.`
      );
      console.log(
        `     La génération s'est arrêtée avant de finir le test Playwright.`
      );
      console.log(
        `     Cause: le modèle a atteint sa limite de tokens de sortie.`
      );
    } else if (r.finishReason === "stop") {
      console.log(
        `  ✅ COMPLET: le modèle a terminé la génération normalement.`
      );
    } else if (r.finishReason === "error") {
      console.log(
        `  ❌ ERREUR: ${r.error}`
      );
    }

    console.log("");
  }

  // ============================================================
  // PROMPT SIZE CONTEXT
  // ============================================================

  console.log("==========================================");
  console.log("PROMPT CONTEXT");
  console.log("==========================================\n");

  console.log(
    `Prompt characters: ${prompt.length}`
  );
  console.log(
    `Estimated input tokens: ~${Math.ceil(prompt.length / 4)}`
  );
  console.log("");

  console.log(
    "Note: Nova Lite (Amazon) is NOT available on Groq."
  );
  console.log(
    "To test Nova Lite, use AWS Bedrock SDK separately."
  );
  console.log("");
  console.log(
    "Source: aws-bedrock-explorer.com/quotas"
  );
  console.log(
    "Source: docs.aws.amazon.com/bedrock/latest/userguide/quotas.html"
  );
}

main().catch((error) => {
  console.error("Measurement failed:", error.message);
  process.exit(1);
});
