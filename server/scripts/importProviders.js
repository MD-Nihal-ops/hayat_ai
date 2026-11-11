const fs = require("node:fs");
const path = require("node:path");
const XLSX = require("xlsx");

const sourcePath = path.join(__dirname, "..", "data", "uae_healthcare_brands.csv");
const verificationPath = path.join(__dirname, "..", "data", "providerVerification.json");
const outputPath = path.join(__dirname, "..", "..", "client", "src", "data", "providers.json");
const generatedComment = "Generated from a researched directory file. Everything TO VERIFY from each provider's official site before use.";
const requiredColumns = [
  "Brand",
  "Ownership",
  "Category",
  "Official Website",
  "Toll-Free / Contact Number",
  "Specializations",
  "Branches / Facilities",
  "Map Link",
  "Data Status"
];
const genericKeywords = new Set([
  "hospital", "medical", "clinic", "health", "healthcare", "life", "care",
  "dubai", "saudi", "german", "center", "centre", "pharmacy", "group"
]);
const ambiguousStandaloneKeywords = new Set(["lifecare"]);
const safeKeywordsByBrand = {
  "purehealth": ["purehealth", "seha", "daman", "rafed", "purelab"],
  "aster dm healthcare": ["aster dm", "aster hospital", "aster clinic", "aster pharmacy"],
  "nmc healthcare": ["nmc healthcare", "nmc hospital", "nmc royal"],
  "burjeel holdings": ["burjeel", "medeor", "lifecare hospital"],
  "mediclinic middle east": ["mediclinic"],
  "dubai health": ["rashid hospital", "dubai hospital", "latifa hospital", "hatta hospital", "dubai health"],
  "emirates health services": ["emirates health services"],
  "thumbay group": ["thumbay"],
  "zulekha healthcare group": ["zulekha"],
  "saudi german health": ["saudi german"]
};

function normalizePhrase(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u0640\p{M}]/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slug(value) {
  return normalizePhrase(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function splitList(value) {
  return String(value || "")
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function kindFromOwnership(value) {
  const ownership = String(value || "").toLowerCase();
  if (/government[\s-]*linked|government[\s-]*related/.test(ownership)) return "government-linked";
  if (ownership.includes("government")) return "government";
  return "private";
}

function categoryGroupFromCategory(value) {
  const category = String(value || "").toLowerCase();
  if (category.includes("group") || category.includes("integrated")) return "group";
  if (/specialty|specialist|maternity|women|pediatric/.test(category)) return "specialty";
  if (/diagnostic|laborator|\blabs?\b|pathology|imaging/.test(category)) return "diagnostics";

  const serviceCount = [
    /hospital/.test(category),
    /clinic/.test(category),
    /pharmacy/.test(category),
    /health cent(?:er|re)/.test(category)
  ].filter(Boolean).length;
  if (serviceCount > 1) return "group";
  if (/pharmacy/.test(category)) return "pharmacy";
  if (/clinic/.test(category)) return "clinic";
  if (/hospital/.test(category)) return "hospital";
  return "other";
}

function websiteFromCell(value) {
  const website = String(value || "").trim();
  return website.startsWith("https://") ? website : "";
}

function phoneFromCell(value) {
  const candidates = String(value || "").split(/[;,]/);
  for (const rawCandidate of candidates) {
    const candidate = rawCandidate.replace(/\s*\([^)]*\)\s*$/, "").trim();
    if (!candidate || /^verify$/i.test(candidate)) continue;
    const compact = candidate.replace(/[\s().-]/g, "");
    if (!/^\+?\d+$/.test(compact)) continue;
    const digits = compact.replace(/\D/g, "");
    if ((digits.length >= 7 && digits.length <= 15) || /^800\d{2,4}$/.test(digits)) {
      return candidate;
    }
  }
  return "";
}

function mapLinkFromCell(value) {
  const mapLink = String(value || "").trim();
  try {
    const url = new URL(mapLink);
    const googleMapsPath = url.protocol === "https:" && (
      (url.hostname === "www.google.com" && url.pathname.startsWith("/maps/")) ||
      (url.hostname === "maps.google.com" && (url.pathname === "/" || url.pathname.startsWith("/maps/")))
    );
    return googleMapsPath ? mapLink : "";
  } catch {
    return "";
  }
}

function keywordCandidate(value) {
  const keyword = normalizePhrase(value);
  if (
    keyword.length < 4 ||
    genericKeywords.has(keyword) ||
    ambiguousStandaloneKeywords.has(keyword) ||
    /\b(?:branches|facilities|entities and partners|across uae)\b/.test(keyword)
  ) return "";
  return keyword;
}

function parseCsvRows() {
  if (!fs.existsSync(sourcePath)) throw new Error(`Provider CSV not found: ${sourcePath}`);
  // SheetJS parses CSV quoting, embedded commas, and UTF-8 without making network requests.
  const csvText = fs.readFileSync(sourcePath, "utf8").replace(/^\uFEFF/, "");
  const workbook = XLSX.read(csvText, { type: "string", codepage: 65001, raw: false });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) throw new Error("Provider CSV has no worksheet");
  const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: "", raw: false });
  const headers = new Set(Object.keys(rows[0] || {}));
  const missingColumns = requiredColumns.filter((column) => !headers.has(column));
  if (missingColumns.length) throw new Error(`Provider CSV is missing columns: ${missingColumns.join(", ")}`);
  return rows;
}

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function readProviderVerification() {
  if (!fs.existsSync(verificationPath)) return {};
  const verification = JSON.parse(fs.readFileSync(verificationPath, "utf8"));
  return verification?.entries && typeof verification.entries === "object" && !Array.isArray(verification.entries)
    ? verification.entries
    : {};
}

function importProviders() {
  const rows = parseCsvRows();
  const verificationEntries = readProviderVerification();
  const skippedRows = [];
  const rawProviders = [];
  const seenIds = new Set();
  let verifiedWebsites = 0;
  let verifiedPhones = 0;
  const verificationResets = [];

  rows.forEach((row, index) => {
    const name = String(row.Brand || "").trim();
    if (!name) {
      skippedRows.push({ row: index + 2, reason: "empty Brand" });
      return;
    }
    const id = slug(name);
    if (!id || seenIds.has(id)) {
      skippedRows.push({ row: index + 2, reason: id ? `duplicate id ${id}` : "Brand produced an empty id" });
      return;
    }
    seenIds.add(id);

    const website = websiteFromCell(row["Official Website"]);
    const phone = phoneFromCell(row["Toll-Free / Contact Number"]);
    const verification = verificationEntries[id];
    const verifiedOn = isValidDate(verification?.verifiedOn) ? verification.verifiedOn : "";
    const websiteVerified = Boolean(
      verification &&
      verification.website === website &&
      website.startsWith("https://") &&
      verifiedOn
    );
    const lastChecked = websiteVerified ? verifiedOn : "";
    const phoneVerified = Boolean(
      websiteVerified &&
      verification.phone === phone &&
      phone
    );
    if (websiteVerified) verifiedWebsites += 1;
    if (phoneVerified) verifiedPhones += 1;

    if (verification) {
      const resetFields = [];
      if (verification.website !== website) resetFields.push("website");
      if (verification.phone !== phone) resetFields.push("phone");
      if (!verifiedOn) resetFields.push("verifiedOn");
      if (resetFields.length) verificationResets.push(`${id} (${resetFields.join(", ")})`);
    }

    rawProviders.push({
      id,
      name,
      kind: kindFromOwnership(row.Ownership),
      category: String(row.Category || "").trim(),
      categoryGroup: categoryGroupFromCategory(row.Category),
      website,
      phone,
      specializations: splitList(row.Specializations),
      branches: splitList(row["Branches / Facilities"]),
      mapLink: mapLinkFromCell(row["Map Link"]),
      nameKeywords: [],
      dataStatus: String(row["Data Status"] || "").trim(),
      websiteVerified,
      phoneVerified,
      lastChecked
    });
  });

  const keywordOwners = new Map();
  const keywordsByProvider = new Map();
  for (const provider of rawProviders) {
    const requiredKeywords = safeKeywordsByBrand[normalizePhrase(provider.name)] || [];
    const candidates = [...requiredKeywords, provider.name, ...provider.branches];
    const providerKeywords = new Set();
    for (const rawKeyword of candidates) {
      const keyword = keywordCandidate(rawKeyword);
      if (!keyword) continue;
      providerKeywords.add(keyword);
      const owners = keywordOwners.get(keyword) || new Set();
      owners.add(provider.id);
      keywordOwners.set(keyword, owners);
    }
    keywordsByProvider.set(provider.id, providerKeywords);
  }

  const duplicateKeywordsRemoved = [...keywordOwners.entries()]
    .filter(([, owners]) => owners.size > 1)
    .map(([keyword, owners]) => ({ keyword, providers: [...owners] }));
  const duplicateKeywordSet = new Set(duplicateKeywordsRemoved.map((item) => item.keyword));
  const noKeywordProviders = [];
  for (const provider of rawProviders) {
    provider.nameKeywords = [...keywordsByProvider.get(provider.id)]
      .filter((keyword) => !duplicateKeywordSet.has(keyword));
    if (!provider.nameKeywords.length) noKeywordProviders.push(provider.name);
  }

  if (rawProviders.length) rawProviders[0]._comment = generatedComment;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(rawProviders, null, 2)}\n`, "utf8");

  const noWebsite = rawProviders.filter((provider) => !provider.website).map((provider) => provider.name);
  const noPhone = rawProviders.filter((provider) => !provider.phone).map((provider) => provider.name);
  console.log(`Rows read: ${rows.length}`);
  console.log(`Rows skipped: ${skippedRows.length}${skippedRows.length ? ` (${skippedRows.map((item) => `row ${item.row}: ${item.reason}`).join("; ")})` : ""}`);
  console.log(`Entries written: ${rawProviders.length}`);
  console.log(`Entries with no website: ${noWebsite.length}${noWebsite.length ? ` (${noWebsite.join(", ")})` : ""}`);
  console.log(`Entries with no phone: ${noPhone.length}${noPhone.length ? ` (${noPhone.join(", ")})` : ""}`);
  console.log(`Entries with no keywords / needs manual keywords: ${noKeywordProviders.length}${noKeywordProviders.length ? ` (${noKeywordProviders.join(", ")})` : ""}`);
  console.log(`Verified websites: ${verifiedWebsites}`);
  console.log(`Verified phones: ${verifiedPhones}`);
  console.log(`Verification reset: ${verificationResets.length ? verificationResets.join("; ") : "none"}`);
  console.log(`Duplicate keywords removed: ${duplicateKeywordsRemoved.length ? duplicateKeywordsRemoved.map(({ keyword, providers }) => `${keyword} (${providers.join(", ")})`).join("; ") : "none"}`);
}

try {
  importProviders();
} catch (error) {
  console.error("[import-providers] failed:", error?.name || "Error");
  console.error(error?.message || "Unknown error");
  process.exitCode = 1;
}
