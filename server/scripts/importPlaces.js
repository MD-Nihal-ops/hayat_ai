const fs = require("node:fs");
const path = require("node:path");
const XLSX = require("xlsx");

const serverRoot = path.join(__dirname, "..");
const sourceConfigs = require("../config/placesImportSources.json");
const UAE_BOUNDS = { minLat: 22, maxLat: 26.5, minLng: 51, maxLng: 56.6 };
const CONFIDENCE_VALUES = new Set(["High", "Medium", "Low", "Unknown"]);

function configuredPath(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Configured file path is missing");
  }
  return path.resolve(serverRoot, ...value.split(/[\\/]+/));
}

function cleanText(value) {
  if (value === null || value === undefined) return null;
  const text = String(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
  return text || null;
}

function validCoordinatePair(latValue, lngValue) {
  if (latValue === null || latValue === undefined || latValue === "" ||
      lngValue === null || lngValue === undefined || lngValue === "") {
    return null;
  }
  const lat = Number(latValue);
  const lng = Number(lngValue);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) ||
      lat < UAE_BOUNDS.minLat || lat > UAE_BOUNDS.maxLat ||
      lng < UAE_BOUNDS.minLng || lng > UAE_BOUNDS.maxLng) {
    return null;
  }
  return { lat, lng };
}

function normalizeConfidence(value) {
  const confidence = cleanText(value);
  return CONFIDENCE_VALUES.has(confidence) ? confidence : "Unknown";
}

function cleanUrl(value) {
  const text = cleanText(value);
  if (!text) return null;
  try {
    const url = new URL(text);
    return url.protocol === "https:" || url.protocol === "http:" ? text : null;
  } catch {
    return null;
  }
}

function splitTags(value, limit = Number.POSITIVE_INFINITY) {
  if (value === null || value === undefined) return [];
  return String(value)
    .split(/[,;]/)
    .map(cleanText)
    .filter(Boolean)
    .slice(0, limit);
}

function duplicateKey(record) {
  const name = (record.name || "").toLocaleLowerCase();
  if (record.lat !== null && record.lng !== null) {
    return JSON.stringify([name, record.lat, record.lng]);
  }
  return JSON.stringify([name, (record.address || "").toLocaleLowerCase()]);
}

function importPlaces(sourceKey) {
  const config = sourceConfigs[sourceKey];
  if (!config) {
    throw new Error(`Unknown source "${sourceKey}". Configure it in placesImportSources.json.`);
  }
  if (!config.columns || typeof config.columns.name !== "string" ||
      typeof config.layer !== "string" || typeof config.sheet !== "string" ||
      !Number.isInteger(config.headerRow) || config.headerRow < 1) {
    throw new Error(`Source "${sourceKey}" has an invalid import configuration`);
  }

  const sourcePath = configuredPath(config.sourceFile);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source file not found: ${sourcePath}`);
  }
  const workbook = XLSX.readFile(sourcePath, { cellDates: false, raw: false });
  const worksheet = workbook.Sheets[config.sheet];
  if (!worksheet) {
    throw new Error(`Sheet "${config.sheet}" was not found in ${config.sourceFile}`);
  }

  const rows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    range: config.headerRow - 1,
    defval: null,
    raw: false
  });
  const headers = (rows[0] || []).map((value) => cleanText(value) || "");
  const requiredHeaders = Object.values(config.columns).filter((value) => typeof value === "string");
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
  if (missingHeaders.length) {
    throw new Error(`Missing configured headers: ${missingHeaders.join(", ")}`);
  }

  const duplicates = new Set();
  const imported = [];
  const skippedReasons = {};
  const confidenceCounts = {};
  const emirateCounts = {};
  let noCoordinates = 0;
  let invalidCoordinates = 0;
  let duplicateCount = 0;
  const dataRows = rows.slice(1).filter((row) =>
    row.some((value) => value !== null && value !== undefined && String(value).trim() !== "")
  );

  dataRows.forEach((row, index) => {
    const valueFor = (field) => {
      const header = config.columns[field];
      return header ? row[headers.indexOf(header)] : null;
    };
    const name = cleanText(valueFor("name"));
    if (!name) {
      skippedReasons.missingName = (skippedReasons.missingName || 0) + 1;
      return;
    }

    const deliveryOnly = /delivery coverage/i.test(String(valueFor("address") || ""));
    const coordinates = deliveryOnly ? null : validCoordinatePair(valueFor("lat"), valueFor("lng"));
    const hasCoordinateInput = valueFor("lat") !== null && valueFor("lat") !== "" ||
      valueFor("lng") !== null && valueFor("lng") !== "";
    if (!coordinates) {
      noCoordinates += 1;
      if (hasCoordinateInput) invalidCoordinates += 1;
    }

    const record = {
      id: `${config.layer}-${index + config.headerRow + 1}`,
      name,
      nameAr: cleanText(valueFor("nameAr")),
      layer: config.layer,
      category: cleanText(valueFor("category")),
      type: cleanText(valueFor("type")),
      emirate: cleanText(valueFor("emirate")),
      address: cleanText(valueFor("address")),
      deliveryOnly,
      plans: splitTags(valueFor("plans"), 8),
      dietary: splitTags(valueFor("dietary")),
      lat: coordinates?.lat ?? null,
      lng: coordinates?.lng ?? null,
      mapsUrl: cleanUrl(valueFor("mapsUrl")),
      osmUrl: cleanUrl(valueFor("osmUrl")),
      confidence: normalizeConfidence(valueFor("confidence")),
      notes: cleanText(valueFor("notes")),
      sourceMatch: cleanText(valueFor("sourceMatch")),
      sourceUrl: cleanText(valueFor("sourceUrl")),
      sourceName: path.basename(config.sourceFile),
      lastVerified: cleanText(valueFor("lastVerified"))
    };

    const key = duplicateKey(record);
    if (duplicates.has(key)) {
      duplicateCount += 1;
      return;
    }
    duplicates.add(key);
    imported.push(record);
    const confidence = record.confidence;
    confidenceCounts[confidence] = (confidenceCounts[confidence] || 0) + 1;
    const emirate = record.emirate || "(blank)";
    emirateCounts[emirate] = (emirateCounts[emirate] || 0) + 1;
  });

  const outputPath = configuredPath(config.outputFile);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(imported, null, 2)}\n`, "utf8");

  console.log(JSON.stringify({
    source: config.sourceFile,
    sheet: config.sheet,
    rowsRead: dataRows.length,
    recordsWritten: imported.length,
    skipped: Object.values(skippedReasons).reduce((sum, count) => sum + count, 0),
    skippedReasons,
    noCoordinates,
    invalidCoordinates,
    countsByEmirate: emirateCounts,
    countsByConfidence: confidenceCounts,
    duplicatesRemoved: duplicateCount,
    output: path.relative(serverRoot, outputPath)
  }, null, 2));
  return imported;
}

if (require.main === module) {
  try {
    const sourceKey = process.argv[2];
    if (!sourceKey) {
      throw new Error("Usage: node scripts/importPlaces.js <source-key>");
    }
    importPlaces(sourceKey);
  } catch (error) {
    console.error("[import-places] failed:", error.message);
    process.exitCode = 1;
  }
}

module.exports = { cleanText, importPlaces, splitTags, validCoordinatePair };
