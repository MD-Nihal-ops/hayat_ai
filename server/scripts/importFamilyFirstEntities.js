const fs = require("node:fs");
const path = require("node:path");
const XLSX = require("xlsx");

const sourcePath = path.join(__dirname, "../data/official/prompt4/UAE_Entity_Service_Directory.xlsx");
const outputPath = path.join(__dirname, "../data/derived/prompt4/entityDirectory.json");
const eventLabels = new Map([
  ["new baby", "new_baby"],
  ["child starting school", "child_school"],
  ["marriage", "marriage"],
  ["moving home", "moving_home"],
  ["elderly care", "elderly_care"],
  ["elderly parent", "elderly_care"],
  ["retirement", "retirement"],
  ["death in the family", "bereavement"]
]);

function text(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isOfficialSource(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (url.hostname === "u.ae" || url.hostname.endsWith(".u.ae") || url.hostname.endsWith(".gov.ae"));
  } catch {
    return false;
  }
}

function dateToIso(value) {
  const match = typeof value === "string" && value.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (!match) return null;
  const date = new Date(`${match[2]} ${match[1]}, ${match[3]} UTC`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

if (!fs.existsSync(sourcePath)) {
  throw new Error(`Prompt 4 source workbook not found: ${sourcePath}`);
}

const workbook = XLSX.readFile(sourcePath);
const sheet = workbook.Sheets["Entity Service Directory"];
if (!sheet) throw new Error("Prompt 4 workbook is missing the Entity Service Directory sheet");

const sourceRows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
const entities = [];
for (let index = 0; index < sourceRows.length; index += 1) {
  const row = sourceRows[index];
  const entityName = text(row["Government entity"]);
  const sourceUrl = text(row["Source URL"]);
  const officialInfoUrl = text(row["Official service / information URL"]);
  if (!entityName) throw new Error(`Prompt 4 row ${index + 2} has no entity name`);

  const lifeEvents = [...new Set(
    String(row["Life events supported"] || "")
      .split(";")
      .map((label) => eventLabels.get(label.trim().toLowerCase()))
      .filter(Boolean)
  )];
  const lastVerified = dateToIso(text(row["Date checked"]));
  const sourceUpdatedAt = dateToIso(text(row["Page last updated"]));
  const sourceIsVerified = isOfficialSource(sourceUrl);
  const officialInfoUrlIsValid = isOfficialSource(officialInfoUrl);
  const website = text(row["Official entity website"]);

  for (const lifeEvent of lifeEvents) {
    entities.push({
      entityId: `prompt4-row-${index + 2}-${lifeEvent}`,
      lifeEvent,
      serviceCategory: text(row["Service category"]),
      entityName,
      officialWebsite: isHttpsUrl(website) ? website : null,
      lifeEventServices: text(row["Services provided"]),
      documentsToPrepare: text(row["Documents to prepare"]),
      nextSteps: text(row["What to do next / journey steps"]),
      timingAndFees: text(row["Deadlines, timing and fees"]),
      applicantInformation: text(row["Who the service is for"]),
      boundaryNote: text(row["Boundary / what the guide must not do"]),
      officialInfoUrl: officialInfoUrlIsValid ? officialInfoUrl : null,
      sourceUrl: sourceIsVerified ? sourceUrl : null,
      lastVerified,
      sourceUpdatedAt,
      verificationStatus: sourceIsVerified && officialInfoUrlIsValid && lastVerified
        ? "verified_from_supplied_workbook"
        : "incomplete_source"
    });
  }
}

if (!entities.length) throw new Error("Prompt 4 workbook contains no entries for supported life events");
for (const lifeEvent of eventLabels.values()) {
  if (!entities.some((entity) => entity.lifeEvent === lifeEvent)) {
    throw new Error(`Prompt 4 workbook contains no entities for ${lifeEvent}`);
  }
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify({
  sourceFile: "server/data/official/prompt4/UAE_Entity_Service_Directory.xlsx",
  importedAt: new Date().toISOString(),
  entities
}, null, 2)}\n`);
console.log(`Imported ${entities.length} Prompt 4 entity records to ${path.relative(process.cwd(), outputPath)}`);
