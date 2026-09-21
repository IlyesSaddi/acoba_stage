require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { BedrockRuntimeClient, ConverseCommand } = require("@aws-sdk/client-bedrock-runtime");

const PROMPT_PATH = path.join(__dirname, "generated-workflow-prompt.txt");

if (!fs.existsSync(PROMPT_PATH)) {
  console.error(`Prompt file not found: ${PROMPT_PATH}`);
  process.exit(1);
}

const prompt = fs.readFileSync(PROMPT_PATH, "utf8");

const MODEL_ID = process.env.BEDROCK_MODEL_ID || "eu.amazon.nova-micro-v1:0";
const REGION = process.env.AWS_REGION || "eu-west-1";

async function measureBedrock() {
  const config = { region: REGION };
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    };
  }

  const client = new BedrockRuntimeClient(config);

  const command = new ConverseCommand({
    modelId: MODEL_ID,
    system: [
      {
        text: "You are an expert software test engineer. You output ONLY raw Playwright test code. No markdown fences, no section headings, no analysis text, no explanations. Only import statements, test blocks, page actions, assertions, and short inline comments."
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

  const start = performance.now();
  const response = await client.send(command);
  const end = performance.now();

  const durationMs = end - start;
  const durationSec = (durationMs / 1000).toFixed(2);

  const usage = response.usage || {};
  const stopReason = response.stopReason || "unknown";

  const inputTokens = usage.inputTokens || 0;
  const outputTokens = usage.outputTokens || 0;
  const totalTokens = usage.totalTokens || (inputTokens + outputTokens);

  let status = "OK";
  if (stopReason === "max_tokens" || stopReason === "length") {
    status = "Tronqué";
  } else if (stopReason === "end_turn" || stopReason === "stop_sequence") {
    status = "OK";
  }

  console.log("==========================================");
  console.log("AWS BEDROCK MEASUREMENT RESULTS");
  console.log("==========================================");
  console.log(`Modèle        : Amazon Nova Micro (${MODEL_ID})`);
  console.log(`Input Tokens  : ${inputTokens}`);
  console.log(`Output Tokens : ${outputTokens}`);
  console.log(`Total Tokens  : ${totalTokens}`);
  console.log(`Finish Reason : ${stopReason}`);
  console.log(`Durée         : ${durationSec} s`);
  console.log(`Statut        : ${status}`);
  console.log("==========================================\n");

  const tableRow = [
    "Amazon Nova Micro",
    String(inputTokens),
    String(outputTokens),
    String(totalTokens),
    stopReason === "end_turn" ? "stop" : stopReason,
    `${durationSec} s`,
    status
  ];

  console.log("FORMAT TABLEAU (à ajouter à votre comparatif) :");
  console.log(tableRow.join("\t"));
}

measureBedrock().catch((err) => {
  console.error("Erreur de mesure Bedrock:", err);
  process.exit(1);
});
