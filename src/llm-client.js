require("dotenv").config();

const Groq = require("groq-sdk");
const mockLLM = require("./mock-llm");

async function generateWithGroq(prompt) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is missing. Check your .env file."
    );
  }

  const client = new Groq({
    apiKey: process.env.GROQ_API_KEY
  });

  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  console.log("==========================================");
  console.log("GROQ LLM");
  console.log("==========================================");
  console.log(`Model: ${model}`);
  console.log(`Prompt length: ${prompt.length} characters`);
  console.log("Sending request to Groq...");

  const llmStart = performance.now();

  const completion = await client.chat.completions.create({
    model: model,
    messages: [
      {
        role: "system",
        content:
          "You are an expert software test engineer. You output ONLY raw Playwright test code. No markdown fences, no section headings, no analysis text, no explanations. Only import statements, test blocks, page actions, assertions, and short inline comments."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0
  });

  const llmEnd = performance.now();
  const llmDurationMs = llmEnd - llmStart;
  const llmDurationSec = (llmDurationMs / 1000).toFixed(2);

  const result = completion.choices?.[0]?.message?.content;

  if (!result) {
    throw new Error("Groq returned an empty response.");
  }

  console.log("Groq response received.");
  console.log(`Response length: ${result.length} characters`);
  console.log(`LLM generation time: ${llmDurationMs.toFixed(0)} ms (${llmDurationSec}s)`);

  return result;
}

async function generateTest(prompt) {
  const provider = process.env.LLM_PROVIDER || "mock";

  console.log("==========================================");
  console.log("LLM CLIENT");
  console.log("==========================================");
  console.log(`Provider: ${provider}`);
  console.log(`Prompt length: ${prompt.length} characters`);

  switch (provider) {
    case "mock":
      console.log("Using Mock LLM...");
      return await mockLLM.generate(prompt);

    case "groq":
      return await generateWithGroq(prompt);

    case "bedrock":
      throw new Error(
        "Bedrock provider is not implemented yet."
      );

    default:
      throw new Error(
        `Unknown LLM provider: ${provider}`
      );
  }
}

module.exports = {
  generateTest
};