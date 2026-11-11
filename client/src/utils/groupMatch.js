import providers from "../data/providers.json";

function normalizeName(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u0640\p{M}]/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findMatchingProvider(value) {
  const normalizedName = normalizeName(value);
  if (!normalizedName) return null;
  const paddedName = ` ${normalizedName} `;
  const matches = providers.filter((provider) => provider.nameKeywords.some((keyword) => {
    const normalizedKeyword = normalizeName(keyword);
    return normalizedKeyword && paddedName.includes(` ${normalizedKeyword} `);
  }));
  return matches.length === 1 ? matches[0] : null;
}

export function matchGroup(name) {
  return findMatchingProvider(name);
}

export function groupFromQuestion(text) {
  return findMatchingProvider(text);
}

export function hasVerifiedProviderWebsite(provider) {
  return Boolean(
    provider?.websiteVerified === true &&
    typeof provider.website === "string" &&
    provider.website.startsWith("https://") &&
    typeof provider.lastChecked === "string" &&
    provider.lastChecked.trim()
  );
}

function hasVerifiedContact(provider) {
  return Boolean(
    provider?.phoneVerified === true &&
    typeof provider.lastChecked === "string" &&
    provider.lastChecked.trim()
  );
}

function isPhoneLike(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  const compact = value.trim().replace(/[\s().-]/g, "");
  if (!/^\+?\d+$/.test(compact)) return false;
  const digits = compact.replace(/\D/g, "");
  return (digits.length >= 7 && digits.length <= 15) || /^800\d{2,4}$/.test(digits);
}

export function hasVerifiedProviderPhone(provider) {
  return Boolean(
    hasVerifiedContact(provider) &&
    isPhoneLike(provider.phone)
  );
}

export function isGoogleMapsLink(value) {
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
