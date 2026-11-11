const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });

async function listModels() {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error("AI_API_KEY is not set in server/.env");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
  );
  if (!response.ok) {
    throw new Error(`Gemini ListModels request failed with status ${response.status}`);
  }

  const result = await response.json();
  for (const model of result.models || []) {
    if (model.supportedGenerationMethods?.includes("generateContent")) {
      console.log("A supported generation model is available.");
    }
  }
}

listModels().catch((error) => {
  console.error("Unable to list available models.");
  process.exitCode = 1;
});
