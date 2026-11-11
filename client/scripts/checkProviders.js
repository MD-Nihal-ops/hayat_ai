import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const dataPath = new URL("../src/data/providers.json", import.meta.url);
const providers = JSON.parse(readFileSync(fileURLToPath(dataPath), "utf8"));
const genericKeywords = new Set([
  "hospital", "medical", "clinic", "health", "healthcare", "life", "care",
  "dubai", "saudi", "german", "center", "centre", "pharmacy", "group"
]);
const errors = [];
const seenIds = new Set();
const seenKeywords = new Map();

function normalizeKeyword(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u0640\p{M}]/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isGoogleMapsLink(value) {
  if (typeof value !== "string" || !value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (
      (url.hostname === "www.google.com" && url.pathname.startsWith("/maps/")) ||
      (url.hostname === "maps.google.com" && (url.pathname === "/" || url.pathname.startsWith("/maps/")))
    );
  } catch {
    return false;
  }
}

function isPhoneLike(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  const compact = value.trim().replace(/[\s().-]/g, "");
  if (!/^\+?\d+$/.test(compact)) return false;
  const digits = compact.replace(/\D/g, "");
  return (digits.length >= 7 && digits.length <= 15) || /^800\d{2,4}$/.test(digits);
}

for (const provider of providers) {
  if (seenIds.has(provider.id)) errors.push(`Duplicate id: ${provider.id}`);
  seenIds.add(provider.id);

  for (const rawKeyword of provider.nameKeywords || []) {
    const keyword = normalizeKeyword(rawKeyword);
    if (keyword.length < 4) errors.push(`Keyword shorter than 4 characters in ${provider.id}: ${rawKeyword}`);
    if (genericKeywords.has(keyword)) errors.push(`Generic keyword in ${provider.id}: ${rawKeyword}`);
    const previousProvider = seenKeywords.get(keyword);
    if (previousProvider && previousProvider !== provider.id) {
      errors.push(`Keyword appears in both ${previousProvider} and ${provider.id}: ${rawKeyword}`);
    } else {
      seenKeywords.set(keyword, provider.id);
    }
  }

  if (provider.websiteVerified === true && (
    typeof provider.website !== "string" ||
    !provider.website.startsWith("https://") ||
    typeof provider.lastChecked !== "string" ||
    !provider.lastChecked.trim()
  )) {
    errors.push(`Verified website needs an https URL and lastChecked: ${provider.id}`);
  }
  if (provider.phoneVerified === true && (
    !isPhoneLike(provider.phone) ||
    typeof provider.lastChecked !== "string" ||
    !provider.lastChecked.trim()
  )) {
    errors.push(`Verified phone needs a valid number and lastChecked: ${provider.id}`);
  }
  if (provider.mapLink && !isGoogleMapsLink(provider.mapLink)) {
    errors.push(`Map link must point to Google Maps: ${provider.id}`);
  }
}

if (errors.length) {
  console.error(`Provider data check failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`Provider data check passed (${providers.length} providers).`);
}
