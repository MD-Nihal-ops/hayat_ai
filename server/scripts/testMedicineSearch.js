const fs = require("node:fs");
const path = require("node:path");
const {
  detectMedicineNames,
  groupByName,
  searchMedicines
} = require("../services/medicineList");

const medicines = JSON.parse(fs.readFileSync(
  path.join(__dirname, "..", "data", "registeredMedicines.json"),
  "utf8"
));

function runCase(name, assertion) {
  try {
    assertion();
    console.log(`PASS ${name}`);
    return true;
  } catch (error) {
    console.error(`FAIL ${name}: ${error.message}`);
    return false;
  }
}

function normalizedName(value) {
  return String(value || "")
    .replace(/\[[^\]]*\]/g, " ")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(/\s+/)
    .filter((word) => word && !/^\d+$/.test(word) &&
      !/^(?:\d+(?:\.\d+)?(?:mg|mcg|μg|g|kg|ml|l|iu|units?|meq|mmol|%)?|(?:mg|mcg|μg|g|kg|ml|l|iu|units?|meq|mmol)\d+(?:\.\d+)?)$/i.test(word) &&
      !["tablet", "tablets", "tab", "tabs", "capsule", "capsules", "cap", "caps",
        "mg", "mcg", "μg", "g", "kg", "ml", "l", "iu", "unit", "units", "meq",
        "mmol", "percent", "w", "v"].includes(word))
    .join(" ");
}

function findVariantQuery() {
  const grouped = new Map();
  for (const medicine of medicines) {
    const key = normalizedName(medicine.name);
    if (!key) continue;
    const group = grouped.get(key) || [];
    group.push(medicine);
    grouped.set(key, group);
  }
  for (const group of grouped.values()) {
    if (new Set(group.map((item) => item.form)).size < 2 &&
        new Set(group.map((item) => item.strength)).size < 2) continue;
    const query = group[0].name;
    const matches = searchMedicines(query, { limit: 5 });
    const matchedGroup = groupByName(matches).find((item) =>
      new Set(item.products.map((product) => product.form)).size > 1 ||
      new Set(item.products.map((product) => product.strength)).size > 1
    );
    if (matchedGroup) return { query, matchedGroup };
  }
  throw new Error("No multi-form or multi-strength product group was found");
}

let failures = 0;
const exactName = medicines.find((medicine) => normalizedName(medicine.name).split(" ").length > 1)?.name;

if (!runCase("exact name", () => {
  if (!exactName) throw new Error("No suitable exact-name record exists");
  if (!searchMedicines(exactName).some((match) => match.matchType === "exact")) {
    throw new Error(`No exact match for ${exactName}`);
  }
})) failures += 1;

if (!runCase("partial name", () => {
  const matches = searchMedicines("paracetam", { limit: 5 });
  if (!matches.some((match) => match.matchType === "prefix")) throw new Error("Expected a prefix match");
})) failures += 1;

if (!runCase("misspelling", () => {
  const matches = searchMedicines("paracetomol", { limit: 5 });
  if (!matches.some((match) => match.matchType === "edit_distance")) {
    throw new Error("Expected an edit-distance-one match");
  }
})) failures += 1;

if (!runCase("name with strength", () => {
  const matches = searchMedicines("PARACETAMOL 500mg Tablets", { limit: 5 });
  if (!matches.length || !matches.some((match) => match.matchType === "exact" || match.matchType === "all_words")) {
    throw new Error("Strength and tablet terms should be ignored for matching");
  }
})) failures += 1;

if (!runCase("name with several forms or strengths", () => {
  const { matchedGroup } = findVariantQuery();
  if (matchedGroup.products.length < 2) throw new Error("Expected grouped product variants");
})) failures += 1;

if (!runCase("name not in list", () => {
  if (searchMedicines("zzqvnotamedicinenotfound").length) {
    throw new Error("Unexpected match for a name absent from the source list");
  }
})) failures += 1;

if (!runCase("empty query", () => {
  if (searchMedicines(" ").length) throw new Error("An empty query must not match");
})) failures += 1;

if (detectMedicineNames("Please check Paracetamol and sodium").length > 5) {
  console.error("FAIL chat medicine detection maximum: more than five names returned");
  failures += 1;
} else {
  console.log("PASS chat medicine detection maximum");
}

if (failures) process.exitCode = 1;
