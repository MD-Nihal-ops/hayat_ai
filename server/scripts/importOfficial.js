const fs = require("node:fs");
const path = require("node:path");
const XLSX = require("xlsx");

const dataDirectory = path.join(__dirname, "..", "data");
const workbookPath = path.join(dataDirectory, "official", "facilities.xlsx");
const outputPath = path.join(dataDirectory, "officialFacilities.json");
const source = "MOHAP open data, Geocoded Location of Health Facilities - GIS 2026";
const requiredColumns = [
  "Facility Name English",
  "Facility Name Arabic",
  "Coordinator",
  "URL Link"
];
const coordinateNumber = "[-+]?(?:\\d+\\.\\d+|\\d+)";

function validCoordinatePair(first, second) {
  if (first >= 22 && first <= 26.5 && second >= 51 && second <= 56.6) {
    return { lat: first, lng: second };
  }
  if (second >= 22 && second <= 26.5 && first >= 51 && first <= 56.6) {
    return { lat: second, lng: first };
  }
  return null;
}

function parseCoordinatePair(text) {
  if (typeof text !== "string") {
    return null;
  }

  const numbers = text.match(new RegExp(coordinateNumber, "g"));
  if (!numbers || numbers.length < 2) {
    return null;
  }
  return validCoordinatePair(Number(numbers[0]), Number(numbers[1]));
}

function coordinatesFromUrl(value) {
  if (typeof value !== "string") {
    return null;
  }

  const patterns = [
    new RegExp(`@(${coordinateNumber}),\\s*(${coordinateNumber})`, "i"),
    new RegExp(`[?&]q=(${coordinateNumber}),\\s*(${coordinateNumber})`, "i"),
    new RegExp(`[?&]ll=(${coordinateNumber}),\\s*(${coordinateNumber})`, "i"),
    new RegExp(`!3d(${coordinateNumber})!4d(${coordinateNumber})`, "i")
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) {
      const coordinates = validCoordinatePair(Number(match[1]), Number(match[2]));
      if (coordinates) {
        return coordinates;
      }
    }
  }
  return null;
}

function facilityType(name) {
  const normalized = name.toLocaleLowerCase();
  if (/\bpharmacy\b/.test(normalized) || normalized.includes("صيدلية")) {
    return "pharmacy";
  }
  if (/\bhospital\b/.test(normalized) || normalized.includes("مستشفى")) {
    return "hospital";
  }
  if (
    /\b(?:clinic|polyclinic|medical center|medical centre)\b/.test(normalized) ||
    normalized.includes("عيادة") ||
    normalized.includes("مركز طبي")
  ) {
    return "clinic";
  }
  return null;
}

function findFacilityTable(workbook) {
  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      defval: null,
      raw: false
    });
    const headerIndex = rows.findIndex((row) => {
      const columns = row.map((value) => String(value ?? "").trim());
      return requiredColumns.every((column) => columns.includes(column));
    });
    if (headerIndex === -1) {
      continue;
    }

    const headers = rows[headerIndex].map((value) => String(value ?? "").trim());
    const records = rows.slice(headerIndex + 1)
      .filter((row) => row.some((value) => value !== null && value !== undefined && String(value).trim() !== ""))
      .map((row) => Object.fromEntries(
        requiredColumns.map((column) => [column, row[headers.indexOf(column)] ?? ""])
      ));
    return records;
  }
  throw new Error(`No worksheet contains required columns: ${requiredColumns.join(", ")}`);
}

function importOfficialFacilities() {
  if (!fs.existsSync(workbookPath)) {
    throw new Error(`Workbook not found: ${workbookPath}`);
  }

  const workbook = XLSX.readFile(workbookPath, { cellDates: false });
  const rows = findFacilityTable(workbook);
  const uniqueFacilities = new Map();
  let noCoordinates = 0;
  let skippedByType = 0;
  const counts = { pharmacy: 0, hospital: 0, clinic: 0 };

  rows.forEach((row, index) => {
    const coordinates = parseCoordinatePair(String(row.Coordinator ?? "")) ||
      coordinatesFromUrl(String(row["URL Link"] ?? ""));
    if (!coordinates) {
      noCoordinates += 1;
      return;
    }

    const englishName = String(row["Facility Name English"] ?? "").trim();
    const arabicName = String(row["Facility Name Arabic"] ?? "").trim();
    const type = facilityType(`${englishName} ${arabicName}`.trim());
    if (!type) {
      skippedByType += 1;
      return;
    }

    const name = englishName || arabicName;
    const duplicateKey = JSON.stringify([name, coordinates.lat, coordinates.lng]);
    if (uniqueFacilities.has(duplicateKey)) {
      return;
    }

    uniqueFacilities.set(duplicateKey, {
      id: `mohap-${index + 1}`,
      name,
      nameAr: arabicName,
      type,
      lat: coordinates.lat,
      lng: coordinates.lng,
      source
    });
    counts[type] += 1;
  });

  const facilities = [...uniqueFacilities.values()];
  fs.writeFileSync(outputPath, `${JSON.stringify(facilities, null, 2)}\n`, "utf8");
  console.log("Official facility import completed.");
}

try {
  importOfficialFacilities();
} catch (error) {
  console.error("[import-official] failed:", error?.name || "Error");
  process.exitCode = 1;
}
