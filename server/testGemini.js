require("dns").setDefaultResultOrder("ipv4first");
require("dotenv").config({ path: __dirname + "/.env" });

const key = process.env.AI_API_KEY;
const models = [process.env.AI_MODEL_PRIMARY, process.env.AI_MODEL_FALLBACK].filter(Boolean);

(async () => {
  for (const m of models) {
    const t = Date.now();
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({ contents: [{ parts: [{ text: "Reply with the word OK" }] }] }),
          signal: AbortSignal.timeout(20000),
        }
      );
      console.log("Gemini request completed:", r.status, Date.now() - t, "ms");
    } catch (e) {
      console.log("Gemini request failed:", e.name, Date.now() - t, "ms");
    }
  }
})();