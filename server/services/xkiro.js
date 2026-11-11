const API_URL = "https://api.xkiro.com/v1/chat/completions";
const DEFAULT_MODEL = "mistralai/mistral-medium-3.5";
const REQUEST_TIMEOUT_MS = 25000;

function providerError(message, status) {
  const error = new Error(message);
  if (Number.isInteger(status)) error.status = status;
  return error;
}

async function generate(content, {
  apiKey,
  model = DEFAULT_MODEL,
  fetchImpl = global.fetch,
  timeoutMs = REQUEST_TIMEOUT_MS
} = {}) {
  if (typeof apiKey !== "string" || !apiKey.trim()) {
    throw providerError("XKIRO_API_KEY is not configured");
  }
  if (typeof content !== "string" || !content.trim()) {
    throw providerError("xKiro requires a non-empty text prompt");
  }
  if (typeof fetchImpl !== "function") {
    throw providerError("The xKiro HTTP client is unavailable");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let response;
    try {
      response = await fetchImpl(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content }],
          max_tokens: 2048,
          temperature: 0,
          response_format: { type: "json_object" }
        }),
        signal: controller.signal
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        throw providerError("xKiro request timed out");
      }
      throw providerError("xKiro request failed");
    }

    if (!response?.ok) {
      throw providerError(
        Number.isInteger(response?.status) ? `xKiro returned HTTP ${response.status}` : "xKiro request failed",
        response?.status
      );
    }

    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      if (error?.name === "AbortError" || controller.signal.aborted) {
        throw providerError("xKiro request timed out");
      }
      throw providerError("xKiro returned an invalid response");
    }

    const text = payload?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) {
      throw providerError("xKiro returned an empty or invalid response");
    }
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { DEFAULT_MODEL, generate };
