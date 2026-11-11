const fs = require("node:fs");
const path = require("node:path");

const medicinesPath = path.join(__dirname, "..", "data", "registeredMedicines.json");
const rawMedicines = JSON.parse(fs.readFileSync(medicinesPath, "utf8"));
const medicineFields = [
  "name",
  "form",
  "strength",
  "manufacturer",
  "manufacturerCountry",
  "mah",
  "mahCountry"
];
const ignoredWords = new Set([
  "tablet", "tablets", "tab", "tabs",
  "capsule", "capsules", "cap", "caps",
  "mg", "mcg", "μg", "g", "kg", "ml", "l",
  "iu", "unit", "units", "meq", "mmol",
  "percent", "w", "v"
]);
const strengthTokenPattern = /^(?:\d+(?:\.\d+)?(?:mg|mcg|μg|g|kg|ml|l|iu|units?|meq|mmol|%)?|(?:mg|mcg|μg|g|kg|ml|l|iu|units?|meq|mmol)\d+(?:\.\d+)?)$/i;

if (!Array.isArray(rawMedicines)) {
  throw new Error("registeredMedicines.json must contain an array");
}

function normalizeWords(value) {
  return String(value || "")
    .replace(/\[[^\]]*\]/g, " ")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(/\s+/)
    .filter((word) => word &&
      !/^\d+$/.test(word) &&
      !strengthTokenPattern.test(word) &&
      !ignoredWords.has(word));
}

function normalizeName(value) {
  return normalizeWords(value).join(" ");
}

const wordIndex = new Map();
const prefixIndex = new Map();
const deletionIndex = new Map();
const exactIndex = new Map();
const indexedMedicines = rawMedicines.map((record, index) => {
  if (!record || typeof record.name !== "string" || !record.name.trim()) {
    throw new Error(`registeredMedicines.json record ${index} has no name`);
  }
  const medicine = Object.fromEntries(medicineFields.map((field) => [
    field,
    typeof record[field] === "string" ? record[field] : ""
  ]));
  const normalizedName = normalizeName(medicine.name);
  const words = [...new Set(normalizedName.split(" ").filter(Boolean))];
  const entry = { medicine, normalizedName, words, index };

  const exactEntries = exactIndex.get(normalizedName) || [];
  exactEntries.push(entry);
  exactIndex.set(normalizedName, exactEntries);

  for (const word of words) {
    const wordEntries = wordIndex.get(word) || [];
    wordEntries.push(entry);
    wordIndex.set(word, wordEntries);
    for (let length = 2; length <= word.length; length += 1) {
      const prefix = word.slice(0, length);
      const prefixEntries = prefixIndex.get(prefix) || [];
      prefixEntries.push(entry);
      prefixIndex.set(prefix, prefixEntries);
    }
    if (word.length >= 5) {
      for (let position = 0; position < word.length; position += 1) {
        const deletion = word.slice(0, position) + word.slice(position + 1);
        const deletionEntries = deletionIndex.get(deletion) || [];
        deletionEntries.push({ entry, word });
        deletionIndex.set(deletion, deletionEntries);
      }
    }
  }
  return entry;
});

function editDistanceAtMostOne(left, right) {
  if (Math.abs(left.length - right.length) > 1) return false;
  let leftIndex = 0;
  let rightIndex = 0;
  let edits = 0;
  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] === right[rightIndex]) {
      leftIndex += 1;
      rightIndex += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (left.length > right.length) leftIndex += 1;
    else if (right.length > left.length) rightIndex += 1;
    else {
      leftIndex += 1;
      rightIndex += 1;
    }
  }
  if (leftIndex < left.length || rightIndex < right.length) edits += 1;
  return edits <= 1;
}

function candidateHasQueryWords(entry, queryWords) {
  return queryWords.every((word) => entry.words.includes(word));
}

function searchMedicines(query, options = {}) {
  const normalizedQuery = normalizeName(query);
  const queryWords = [...new Set(normalizedQuery.split(" ").filter(Boolean))];
  if (!queryWords.length) return [];

  const candidates = new Map();
  const addCandidate = (entry, matchType, rank) => {
    const current = candidates.get(entry.index);
    if (!current || rank < current.rank) {
      candidates.set(entry.index, { entry, matchType, rank });
    }
  };

  for (const entry of exactIndex.get(normalizedQuery) || []) {
    addCandidate(entry, "exact", 0);
  }

  let allWordCandidates = null;
  for (const word of queryWords) {
    const entries = wordIndex.get(word) || [];
    const entryIndexes = new Set(entries.map((entry) => entry.index));
    allWordCandidates = allWordCandidates === null
      ? entryIndexes
      : new Set([...allWordCandidates].filter((index) => entryIndexes.has(index)));
  }
  for (const index of allWordCandidates || []) {
    const entry = indexedMedicines[index];
    if (candidateHasQueryWords(entry, queryWords)) addCandidate(entry, "all_words", 1);
  }

  const prefixCandidates = new Set();
  for (const word of queryWords) {
    for (const entry of prefixIndex.get(word) || []) prefixCandidates.add(entry.index);
  }
  for (const index of prefixCandidates) {
    const entry = indexedMedicines[index];
    if (queryWords.every((queryWord) =>
      entry.words.some((candidateWord) => candidateWord.startsWith(queryWord))
    )) {
      addCandidate(entry, "prefix", 2);
    }
  }

  const fuzzyCandidates = new Map();
  for (const word of queryWords.filter((part) => part.length >= 5)) {
    const neighbours = new Map();
    const deletions = new Set();
    for (let position = 0; position < word.length; position += 1) {
      deletions.add(word.slice(0, position) + word.slice(position + 1));
    }
    for (const candidate of deletionIndex.get(word) || []) {
      if (editDistanceAtMostOne(word, candidate.word)) {
        neighbours.set(`${candidate.entry.index}:${candidate.word}`, candidate);
      }
    }
    for (const deletion of deletions) {
      for (const entry of wordIndex.get(deletion) || []) {
        const candidate = { entry, word: deletion };
        if (editDistanceAtMostOne(word, deletion)) {
          neighbours.set(`${entry.index}:${deletion}`, candidate);
        }
      }
      for (const candidate of deletionIndex.get(deletion) || []) {
        if (editDistanceAtMostOne(word, candidate.word)) {
          neighbours.set(`${candidate.entry.index}:${candidate.word}`, candidate);
        }
      }
    }
    for (const candidate of neighbours.values()) {
      const otherWords = queryWords.filter((queryWord) => queryWord !== word);
      if (otherWords.every((queryWord) => candidate.entry.words.includes(queryWord))) {
        fuzzyCandidates.set(candidate.entry.index, candidate.entry);
      }
    }
  }
  for (const entry of fuzzyCandidates.values()) addCandidate(entry, "edit_distance", 3);

  const requestedLimit = Number.isInteger(options.limit) && options.limit > 0
    ? Math.min(options.limit, 100)
    : 5;
  return [...candidates.values()]
    .sort((left, right) =>
      left.rank - right.rank ||
      left.entry.medicine.name.localeCompare(right.entry.medicine.name) ||
      left.entry.index - right.entry.index
    )
    .slice(0, requestedLimit)
    .map(({ entry, matchType }) => ({ ...entry.medicine, matchType }));
}

function groupByName(matches) {
  const groups = new Map();
  for (const match of matches) {
    const key = normalizeName(match.name);
    let group = groups.get(key);
    if (!group) {
      group = { name: match.name, products: [] };
      groups.set(key, group);
    }
    group.products.push(match);
  }
  return [...groups.values()];
}

function detectMedicineNames(text) {
  const tokens = String(text || "").match(/[\p{L}]{4,}/gu) || [];
  const detected = [];
  const seen = new Set();
  for (const token of tokens) {
    const normalized = normalizeName(token);
    if (normalized.length < 4 || !wordIndex.has(normalized) || seen.has(normalized)) continue;
    seen.add(normalized);
    detected.push(token);
    if (detected.length === 5) break;
  }
  return detected;
}

function checkMedicine(query) {
  const matches = searchMedicines(query, { limit: 5 });
  if (!matches.length) return { status: "not_found", matches };
  const status = matches.some((match) => match.matchType === "exact" || match.matchType === "all_words")
    ? "found"
    : "possible";
  return { status, matches };
}

module.exports = {
  checkMedicine,
  detectMedicineNames,
  groupByName,
  searchMedicines
};
