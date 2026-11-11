const fs = require("node:fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { DEFAULT_MODEL: DEFAULT_XKIRO_MODEL, generate: generateXkiro } = require("./xkiro");

const extractionPrompt = `Extract the document data and return ONLY a valid JSON object, with no markdown or additional text, using exactly this structure:
{
  "documentDate": "ISO YYYY-MM-DD only if a collection or report date is clearly printed, otherwise null",
  "multiplePatients": false,
  "reportType": "must be exactly one of: lab_report, prescription, discharge_summary, imaging_report, bill, referral_letter, other",
  "extractedValues": [
    { "name": "string", "value": "number or string", "unit": "string or null", "printedRange": { "min": "number or null", "max": "number or null" }, "instructions": "prescription only: exact printed instructions, or null" }
  ],
  "documentDetails": {
    "reasonForVisit": "discharge summary only, exact text or null",
    "events": ["discharge summary only, exact printed events"],
    "medicines": ["discharge summary only, exact listed medicines and printed instructions"],
    "followUps": ["discharge summary only, exact follow-up instructions"],
    "warningSigns": ["discharge summary only, warning signs exactly as printed"],
    "writtenReport": "imaging report only, exact written findings/impression, never interpret images",
    "billLines": [{ "description": "exact printed line description", "amount": "exact printed amount and currency, or null" }],
    "insuranceText": "bill only, exact printed insurance/coverage wording, or null",
    "summary": "other document only, short transcription of relevant non-identity content, or null",
    "couldNotRead": ["only text that is visibly unreadable or fields that are visibly missing"]
  }
}
Extract measurable results and only the relevant document text requested by documentDetails. Do NOT extract patient name, age, date of birth, gender, patient ID, addresses, phone numbers, provider names or other identifiers.
Never use labels like "Sample 1", "Sample 2", "Patient 1", or patient names in the "name" field. Use only the plain test name, for example "Blood pressure".
If the document contains more than one patient, extract only the FIRST patient's results and set "multiplePatients" to true. Otherwise set "multiplePatients" to false.
Extract ONLY the range printed on the report. Do not infer, calculate, or supply a range from another source. Leave printedRange.min and printedRange.max null if no range is printed. Extract raw data only; do not explain or judge any values.`;

const reportTypes = new Set([
  "lab_report", "prescription", "discharge_summary", "imaging_report", "bill", "referral_letter", "other"
]);

function boundedText(value, limit = 1200) {
  return typeof value === "string" ? value.trim().slice(0, limit) : null;
}

function validateDocumentExtraction(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      !reportTypes.has(value.reportType) || typeof value.multiplePatients !== "boolean" ||
      !Array.isArray(value.extractedValues)) {
    throw new Error("The AI returned an invalid document extraction");
  }
  const extractedValues = value.extractedValues.slice(0, 300).map((item) => {
    if (!item || typeof item !== "object" || typeof item.name !== "string" ||
        !(typeof item.value === "string" || typeof item.value === "number" || item.value === null)) {
      throw new Error("The AI returned an invalid extracted value");
    }
    const extracted = {
      name: item.name.trim().slice(0, 200),
      value: item.value,
      unit: boundedText(item.unit, 80),
      printedRange: {
        min: item.printedRange?.min ?? null,
        max: item.printedRange?.max ?? null
      }
    };
    if (value.reportType === "prescription") extracted.instructions = boundedText(item.instructions, 500);
    return extracted;
  }).filter((item) => item.name);
  const details = value.documentDetails && typeof value.documentDetails === "object" && !Array.isArray(value.documentDetails)
    ? value.documentDetails
    : {};
  const strings = (input, limit = 30) => Array.isArray(input)
    ? input.slice(0, limit).map((item) => boundedText(item)).filter(Boolean)
    : [];
  const documentDetails = {
    reasonForVisit: value.reportType === "discharge_summary" ? boundedText(details.reasonForVisit) : null,
    events: value.reportType === "discharge_summary" ? strings(details.events) : [],
    medicines: value.reportType === "discharge_summary" ? strings(details.medicines) : [],
    followUps: value.reportType === "discharge_summary" ? strings(details.followUps) : [],
    warningSigns: value.reportType === "discharge_summary" ? strings(details.warningSigns) : [],
    writtenReport: value.reportType === "imaging_report" ? boundedText(details.writtenReport, 4000) : null,
    billLines: value.reportType === "bill" && Array.isArray(details.billLines)
      ? details.billLines.slice(0, 100).map((line) => ({
        description: boundedText(line?.description, 300),
        amount: boundedText(line?.amount, 100)
      })).filter((line) => line.description)
      : [],
    insuranceText: value.reportType === "bill" ? boundedText(details.insuranceText) : null,
    summary: value.reportType === "other" ? boundedText(details.summary, 3000) : null,
    couldNotRead: strings(details.couldNotRead)
  };
  return {
    reportType: value.reportType,
    documentDate: boundedText(value.documentDate, 10),
    multiplePatients: value.multiplePatients,
    extractedValues,
    documentDetails
  };
}

function parseModelJson(text) {
  const cleanedText = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const start = cleanedText.indexOf("{");
  const end = cleanedText.lastIndexOf("}");

  try {
    if (start === -1 || end === -1 || end < start) {
      throw new Error("No JSON object found");
    }
    return JSON.parse(cleanedText.slice(start, end + 1));
  } catch {
    throw new Error("The AI returned an unreadable answer. Please try again.");
  }
}

async function generateWithFallback(content) {
  if (typeof process.env.AI_API_KEY !== "string" || !process.env.AI_API_KEY.trim()) {
    throw new Error("AI_API_KEY is not configured.");
  }
  const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY);
  const primaryModel = process.env.AI_MODEL_PRIMARY;
  const fallbackModel = process.env.AI_MODEL_FALLBACK;
  const retryDelay = 2000;
  let generation;

  async function generateWithTimeout(modelName) {
    const model = genAI.getGenerativeModel({ model: modelName });
    let timeoutId;
    try {
      return await Promise.race([
        model.generateContent(content),
        new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error("AI request timed out")), 25000);
        })
      ]);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function isBusyError(error) {
    const message = (error?.message || "").toLowerCase();
    return ["timeout", "timed out", "503", "429", "high demand", "overloaded"]
      .some((phrase) => message.includes(phrase));
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      generation = await generateWithTimeout(primaryModel);
      break;
    } catch (error) {
      if (!isBusyError(error)) {
        throw new Error("The AI provider request failed. Please try again.");
      }
      if (attempt === 1) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  if (!generation && fallbackModel) {
    try {
      generation = await generateWithTimeout(fallbackModel);
    } catch (error) {
      if (!isBusyError(error)) {
        throw new Error("The AI provider request failed. Please try again.");
      }
    }
  }

  if (!generation) {
    throw new Error("The AI is very busy right now. Please wait a minute and try again.");
  }

  return generation;
}

function createChatGeneration(text) {
  return { response: { text: () => text } };
}

function createChatAiService({
  env = process.env,
  generateXkiroModel = generateXkiro,
  generateGemini = generateWithFallback
} = {}) {
  async function generateChatWithFallback(content) {
    const provider = env.AI_CHAT_PROVIDER || "gemini";
    if (provider !== "gemini" && provider !== "xkiro") {
      throw new Error("AI_CHAT_PROVIDER must be gemini or xkiro.");
    }

    if (provider === "xkiro" &&
        env.XKIRO_ALLOW_HEALTH_DATA === "true" &&
        typeof env.XKIRO_API_KEY === "string" &&
        env.XKIRO_API_KEY.trim()) {
      try {
        const text = await generateXkiroModel(content, {
          apiKey: env.XKIRO_API_KEY,
          model: env.XKIRO_MODEL_PRIMARY || DEFAULT_XKIRO_MODEL
        });
        return createChatGeneration(text);
      } catch {
        // Provider errors can contain request data; fail over without logging them.
      }
    }

    try {
      return await generateGemini(content);
    } catch {
      throw new Error("The AI is temporarily unavailable. Please try again.");
    }
  }

  return { generateChatWithFallback };
}

const { generateChatWithFallback } = createChatAiService();

async function extractDocument(filePath, mimeType) {
  const fileBase64 = fs.readFileSync(filePath).toString("base64");
  const generation = await generateWithFallback([
    extractionPrompt,
    {
      inlineData: {
        data: fileBase64,
        mimeType
      }
    }
  ]);
  const responseText = generation.response.text();
  return validateDocumentExtraction(parseModelJson(responseText));
}

const insurancePolicyPrompt = `Read this insurance policy or insurance card and return ONLY a valid JSON object with exactly these keys:
{
  "insurerName": null,
  "planName": null,
  "policyholderName": null,
  "organizationName": null,
  "policyNumber": null,
  "memberId": null,
  "startDate": null,
  "endDate": null,
  "insurerPhone": null
}
Extract only what is printed on the document. Use null when a value is not printed. Dates may be returned only as ISO YYYY-MM-DD when clearly readable; otherwise use null. Do not infer, calculate, or guess. Do NOT extract coverage percentages, limits, or medical history. If the document is not an insurance policy or card, return exactly { "notInsurance": true }.`;

async function extractPolicy(filePath, mimeType) {
  const fileBase64 = fs.readFileSync(filePath).toString("base64");
  const generation = await generateWithFallback([
    insurancePolicyPrompt,
    {
      inlineData: {
        data: fileBase64,
        mimeType
      }
    }
  ]);
  return parseModelJson(generation.response.text());
}

module.exports = {
  extractDocument,
  extractPolicy,
  generateWithFallback,
  generateChatWithFallback,
  parseModelJson,
  validateDocumentExtraction,
  createChatAiService
};
