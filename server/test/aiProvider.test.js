const test = require("node:test");
const assert = require("node:assert/strict");
const { generate: generateXkiro } = require("../services/xkiro");
const { createChatAiService } = require("../services/ai");

const fakeKey = "test-xkiro-key-not-a-credential";
const sensitivePrompt = "synthetic health chat content";

function response(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload
  };
}

test("xKiro returns a compatible non-empty response", async () => {
  let request;
  const text = '{"answer":"Hello","handoff":"none"}';
  const result = await generateXkiro(sensitivePrompt, {
    apiKey: fakeKey,
    fetchImpl: async (url, options) => {
      request = { url, options };
      return response(200, { choices: [{ message: { content: text } }] });
    }
  });

  assert.equal(result, text);
  assert.equal(request.url, "https://api.xkiro.com/v1/chat/completions");
  assert.equal(request.options.headers.Authorization, `Bearer ${fakeKey}`);
  const body = JSON.parse(request.options.body);
  assert.equal(body.model, "mistralai/mistral-medium-3.5");
  assert.deepEqual(body.response_format, { type: "json_object" });
});

test("configured chat uses xKiro and preserves the Gemini response contract", async () => {
  let xkiroOptions;
  let geminiCalls = 0;
  const service = createChatAiService({
    env: {
      AI_CHAT_PROVIDER: "xkiro",
      XKIRO_ALLOW_HEALTH_DATA: "true",
      XKIRO_API_KEY: fakeKey,
      XKIRO_MODEL_PRIMARY: "mistralai/mistral-small-2603"
    },
    generateXkiroModel: async (_content, options) => {
      xkiroOptions = options;
      return '{"answer":"Hello","handoff":"none"}';
    },
    generateGemini: async () => {
      geminiCalls += 1;
      throw new Error("Gemini should not be called for a successful xKiro response");
    }
  });

  const result = await service.generateChatWithFallback(sensitivePrompt);
  assert.equal(result.response.text(), '{"answer":"Hello","handoff":"none"}');
  assert.equal(xkiroOptions.apiKey, fakeKey);
  assert.equal(xkiroOptions.model, "mistralai/mistral-small-2603");
  assert.equal(geminiCalls, 0);
});

test("xKiro rejects an empty answer", async () => {
  await assert.rejects(
    generateXkiro(sensitivePrompt, {
      apiKey: fakeKey,
      fetchImpl: async () => response(200, { choices: [{ message: { content: "  " } }] })
    }),
    /empty or invalid response/
  );
});

test("xKiro timeout aborts the request without exposing provider details", async () => {
  await assert.rejects(
    generateXkiro(sensitivePrompt, {
      apiKey: fakeKey,
      timeoutMs: 5,
      fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => {
          const error = new Error(`${fakeKey} ${sensitivePrompt}`);
          error.name = "AbortError";
          reject(error);
        });
      })
    }),
    (error) => error.message === "xKiro request timed out"
  );
});

for (const status of [429, 503]) {
  test(`xKiro HTTP ${status} fails over without exposing its response body`, async () => {
    await assert.rejects(
      generateXkiro(sensitivePrompt, {
        apiKey: fakeKey,
        fetchImpl: async () => ({
          ok: false,
          status,
          text: async () => `${fakeKey} ${sensitivePrompt}`
        })
      }),
      (error) => error.status === status &&
        error.message === `xKiro returned HTTP ${status}` &&
        !error.message.includes(fakeKey) &&
        !error.message.includes(sensitivePrompt)
    );
  });
}

test("xKiro rejects malformed provider JSON safely", async () => {
  await assert.rejects(
    generateXkiro(sensitivePrompt, {
      apiKey: fakeKey,
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        json: async () => { throw new SyntaxError(`${fakeKey} ${sensitivePrompt}`); }
      })
    }),
    (error) => error.message === "xKiro returned an invalid response"
  );
});

test("xKiro chat falls back to Gemini after provider failures", async () => {
  for (const failure of [
    new Error("empty response"),
    Object.assign(new Error("rate limit"), { status: 429 }),
    Object.assign(new Error("unavailable"), { status: 503 }),
    new Error("malformed response"),
    Object.assign(new Error("timeout"), { name: "AbortError" })
  ]) {
    let geminiCalls = 0;
    const service = createChatAiService({
      env: {
        AI_CHAT_PROVIDER: "xkiro",
        XKIRO_ALLOW_HEALTH_DATA: "true",
        XKIRO_API_KEY: fakeKey
      },
      generateXkiroModel: async () => { throw failure; },
      generateGemini: async () => {
        geminiCalls += 1;
        return { response: { text: () => "gemini fallback" } };
      }
    });

    const result = await service.generateChatWithFallback(sensitivePrompt);
    assert.equal(result.response.text(), "gemini fallback");
    assert.equal(geminiCalls, 1);
  }
});

test("xKiro health data is not sent unless explicitly enabled", async () => {
  let xkiroCalls = 0;
  const service = createChatAiService({
    env: { AI_CHAT_PROVIDER: "xkiro", XKIRO_API_KEY: fakeKey },
    generateXkiroModel: async () => {
      xkiroCalls += 1;
      return "xkiro response";
    },
    generateGemini: async () => ({ response: { text: () => "gemini response" } })
  });

  const result = await service.generateChatWithFallback(sensitivePrompt);
  assert.equal(result.response.text(), "gemini response");
  assert.equal(xkiroCalls, 0);
});

test("missing xKiro API key uses the configured Gemini fallback", async () => {
  let xkiroCalls = 0;
  const service = createChatAiService({
    env: { AI_CHAT_PROVIDER: "xkiro", XKIRO_ALLOW_HEALTH_DATA: "true" },
    generateXkiroModel: async () => {
      xkiroCalls += 1;
      return "unexpected";
    },
    generateGemini: async () => ({ response: { text: () => "gemini response" } })
  });

  const result = await service.generateChatWithFallback(sensitivePrompt);
  assert.equal(result.response.text(), "gemini response");
  assert.equal(xkiroCalls, 0);
});

test("missing all provider credentials returns a safe error and logs nothing", async () => {
  const logs = [];
  const original = {
    error: console.error,
    warn: console.warn,
    log: console.log
  };
  console.error = (...args) => logs.push(args.join(" "));
  console.warn = (...args) => logs.push(args.join(" "));
  console.log = (...args) => logs.push(args.join(" "));

  try {
    const service = createChatAiService({
      env: { AI_CHAT_PROVIDER: "xkiro", XKIRO_ALLOW_HEALTH_DATA: "true" },
      generateXkiroModel: async () => { throw new Error(`${fakeKey} ${sensitivePrompt}`); },
      generateGemini: async () => { throw new Error(`${fakeKey} ${sensitivePrompt}`); }
    });
    await assert.rejects(
      service.generateChatWithFallback(sensitivePrompt),
      (error) => error.message === "The AI is temporarily unavailable. Please try again."
    );
    assert.deepEqual(logs, []);
    assert.ok(!logs.join(" ").includes(fakeKey));
    assert.ok(!logs.join(" ").includes(sensitivePrompt));
  } finally {
    console.error = original.error;
    console.warn = original.warn;
    console.log = original.log;
  }
});

test("direct missing xKiro API key is reported without making a request", async () => {
  let fetchCalls = 0;
  await assert.rejects(
    generateXkiro(sensitivePrompt, {
      fetchImpl: async () => {
        fetchCalls += 1;
        return response(200, {});
      }
    }),
    /XKIRO_API_KEY is not configured/
  );
  assert.equal(fetchCalls, 0);
});
