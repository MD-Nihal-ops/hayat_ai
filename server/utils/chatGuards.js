const emergencyPhrases = require("../config/emergencyPhrases.json");
const supportPhrases = require("../config/supportPhrases.json");

const MAX_MESSAGE_LENGTH = 1000;

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isEmergency(text, language = "en") {
  return includesPhrase(text, [
    ...(emergencyPhrases.en || []),
    ...(emergencyPhrases[language] || [])
  ]);
}

function isSupportNeeded(text, language = "en") {
  return includesPhrase(text, [
    ...(supportPhrases.en || []),
    ...(supportPhrases[language] || [])
  ]);
}

function includesPhrase(text, phrases) {
  const normalizedText = normalizeText(text);
  return phrases.some((phrase) => {
    const normalizedPhrase = normalizeText(phrase);
    return normalizedPhrase && ` ${normalizedText} `.includes(` ${normalizedPhrase} `);
  });
}

function isMessageTooLong(message) {
  return typeof message !== "string" || message.length > MAX_MESSAGE_LENGTH;
}

function checkAnswer(answer, contextText) {
  if (typeof answer !== "string") return false;
  const forbiddenPhrases = [
    /\byou (?:definitely )?have (?:diabetes|anemia|anaemia|cancer|hypertension|high blood pressure|asthma|migraine|covid(?:-19)?|pneumonia|arthritis|copd|stroke|[a-z]+ (?:disease|disorder|syndrome|itis|osis|emia|oma|pathy))\b/i,
    /\byou (?:have been|are) diagnosed with\b/i,
    /\b(?:stop|start|change|skip|double|increase|decrease|reduce)\s+(?:taking\s+)?(?:your\s+)?(?:prescribed|prescription|medicine|medication|dose|dosage)\b/i,
    /\byou should\s+(?:stop|start|change|skip|double|increase|decrease|reduce)\b.{0,50}\b(?:medicine|medication|dose|dosage|prescription)\b/i
  ];
  if (forbiddenPhrases.some((pattern) => pattern.test(answer))) return false;

  const context = String(contextText || "").toLowerCase();
  const quantities = answer.match(/\b\d+(?:[.,]\d+)?\s*(?:mg|mcg|g|ml|iu|units?)\b/gi) || [];
  return quantities.every((quantity) => context.includes(quantity.toLowerCase()));
}

module.exports = {
  MAX_MESSAGE_LENGTH,
  checkAnswer,
  isEmergency,
  isMessageTooLong,
  isSupportNeeded,
  normalizeText
};
