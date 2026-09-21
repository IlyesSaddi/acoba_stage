require("dotenv").config();

const {
  BedrockRuntimeClient,
  ConverseCommand
} = require("@aws-sdk/client-bedrock-runtime");

// ============================================================
// CONFIGURATION
// ============================================================

const MODEL_ID =
  process.env.BEDROCK_MODEL_ID || "eu.amazon.nova-micro-v1:0";

const REGION = process.env.AWS_REGION || "eu-west-1";

// ============================================================
// CLIENT
// ============================================================

function createClient() {
  const config = { region: REGION };

  // If explicit keys are provided in .env, use them.
  // Otherwise the SDK will fall back to ~/.aws/credentials or IAM role.
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    };
  }

  return new BedrockRuntimeClient(config);
}

// ============================================================
// MAIN FUNCTION
// ============================================================

async function callBedrock(prompt, modelId) {
  const client = createClient();
  const resolvedModel = modelId || MODEL_ID;

  console.log("==========================================");
  console.log("BEDROCK CLIENT");
  console.log("==========================================");
  console.log(`Model   : ${resolvedModel}`);
  console.log(`Region  : ${REGION}`);
  console.log(`Prompt  : ${prompt.length} characters`);
  console.log("Sending request to Bedrock...");

  const start = performance.now();

  const command = new ConverseCommand({
    modelId: resolvedModel,
    system: [
      {
        text:
          "You are an expert software test engineer. You output ONLY raw Playwright test code. No markdown fences, no section headings, no analysis text, no explanations. Only import statements, test blocks, page actions, assertions, and short inline comments."
      }
    ],
    messages: [
      {
        role: "user",
        content: [{ text: prompt }]
      }
    ],
    inferenceConfig: {
      temperature: 0,
      maxTokens: 4096
    }
  });

  const response = await client.send(command);

  const end = performance.now();
  const durationMs = end - start;

  const text = response?.output?.message?.content?.[0]?.text;

  if (!text) {
    throw new Error("Bedrock returned an empty response.");
  }

  const inputTokens = response?.usage?.inputTokens || 0;
  const outputTokens = response?.usage?.outputTokens || 0;
  const totalTokens = inputTokens + outputTokens;

  console.log("Bedrock response received.");
  console.log(`Response length : ${text.length} characters`);
  console.log(`Tokens          : ${inputTokens} in / ${outputTokens} out / ${totalTokens} total`);
  console.log(`Duration        : ${durationMs.toFixed(0)} ms (${(durationMs / 1000).toFixed(2)}s)`);

  return { text, inputTokens, outputTokens, totalTokens, durationMs };
}

// Default: uses BEDROCK_MODEL_ID from .env (Nova Micro for generation)
async function askBedrock(prompt) {
  return callBedrock(prompt);
}

// Heal: uses a stronger model for better error correction
async function askBedrockHeal(prompt) {
  const healModel = process.env.BEDROCK_HEAL_MODEL_ID || MODEL_ID;
  return callBedrock(prompt, healModel);
}

// Root cause analysis: locates exact file, line number, and code fix when tests fail
async function askBedrockRootCause(prompt) {
  const client = createClient();
  const resolvedModel = MODEL_ID;

  console.log("==========================================");
  console.log("BEDROCK ROOT CAUSE & CODE FIX ANALYZER");
  console.log("==========================================");

  const command = new ConverseCommand({
    modelId: resolvedModel,
    system: [
      {
        text: "You are an expert software engineer and code auditor. You analyze test failure tracebacks against application source code. Pinpoint the exact source code file, approximate line number, defective code snippet, and exact proposed fix."
      }
    ],
    messages: [
      {
        role: "user",
        content: [{ text: prompt }]
      }
    ],
    inferenceConfig: {
      temperature: 0,
      maxTokens: 2048
    }
  });

  const response = await client.send(command);
  const text = response?.output?.message?.content?.[0]?.text || "Root cause analysis unavailable.";
  return { text };
}

module.exports = { askBedrock, askBedrockHeal, askBedrockRootCause };
