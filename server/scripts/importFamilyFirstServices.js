const fs = require("node:fs");
const path = require("node:path");
const XLSX = require("xlsx");

const sourcePath = path.join(__dirname, "../data/official/prompt1/UAE_Life_Event_Services_Detailed.xlsx");
const outputPath = path.join(__dirname, "../data/derived/prompt1/lifeEventServices.json");

const eventPrefixes = new Map([
  ["New baby", "new_baby"],
  ["Child starting school", "child_school"],
  ["Marriage", "marriage"],
  ["Moving home", "moving_home"],
  ["Elderly parent", "elderly_care"],
  ["Retirement", "retirement"],
  ["Death in the family", "bereavement"]
]);

function text(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function dateToIso(value) {
  const match = typeof value === "string" && value.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!match) return null;
  const date = new Date(`${match[2]} ${match[1]}, ${match[3]} UTC`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function isOfficialUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (url.hostname === "u.ae" || url.hostname.endsWith(".u.ae") || url.hostname.endsWith(".gov.ae"));
  } catch {
    return false;
  }
}

if (!fs.existsSync(sourcePath)) {
  throw new Error(`Prompt 1 source workbook not found: ${sourcePath}`);
}

const workbook = XLSX.readFile(sourcePath);
const sheet = workbook.Sheets["UAE Service Directory"];
if (!sheet) throw new Error("Prompt 1 workbook is missing the UAE Service Directory sheet");

const sourceRows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
const services = [];

for (let index = 0; index < sourceRows.length; index += 1) {
  const row = sourceRows[index];
  const eventLabel = text(row["Life event / service"]);
  const separator = eventLabel?.indexOf(" — ") ?? -1;
  if (separator < 0) throw new Error(`Prompt 1 row ${index + 2} has an invalid life-event label`);
  const eventPrefix = eventLabel.slice(0, separator);
  const lifeEvent = eventPrefixes.get(eventPrefix);
  if (!lifeEvent) continue;

  const officialServiceUrl = text(row["Official application / service URL"]);
  if (!isOfficialUrl(officialServiceUrl)) {
    throw new Error(`Prompt 1 row ${index + 2} has no valid official service URL`);
  }

  const sourceUrlCell = text(row["Source URL"]);
  const dateCheckedCell = text(row["Date checked"]);
  const sourceUpdatedAt = dateToIso(dateCheckedCell);
  // These two workbook columns contain review dates, so use the official service URL as the traceable source.
  const sourceUrl = isOfficialUrl(sourceUrlCell) ? sourceUrlCell : officialServiceUrl;

  services.push({
    serviceId: `prompt1-row-${index + 2}`,
    lifeEvent,
    serviceName: text(row["Official service name"]),
    governmentEntity: text(row["Government entity responsible"]),
    description: null,
    jurisdiction: text(row["Emirate / geographical scope"]),
    applicantType: text(row["Who can apply"]),
    eligibility: text(row["Eligibility requirements"]),
    requiredDocuments: text(row["Required documents"]),
    instructions: text(row["Application steps and dependencies"]),
    prerequisites: null,
    officialFee: text(row["Fees (if officially published)"]),
    officialProcessingTime: null,
    officialDeadline: null,
    officialTiming: text(row["Deadlines / processing times"]),
    officialServiceUrl,
    officialContact: null,
    sourceUrl,
    sourceName: new URL(sourceUrl).hostname === "u.ae" ? "uaePortal" : "notVerified",
    lastVerified: dateToIso(sourceUrlCell),
    sourceUpdatedAt,
    verificationStatus: "verified_from_supplied_workbook",
    // The workbook's contact column contains preparation notes, not contact details.
    guidanceNote: text(row["Contact details (if published)"]),
    sourceMetadata: {
      sourceUrlColumnValue: sourceUrlCell,
      dateCheckedColumnValue: dateCheckedCell
    }
  });
}

if (!services.length) throw new Error("Prompt 1 workbook contains no services for the seven supported life events");
for (const eventKey of eventPrefixes.values()) {
  if (!services.some((service) => service.lifeEvent === eventKey)) {
    throw new Error(`Prompt 1 workbook contains no services for ${eventKey}`);
  }
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify({
  sourceFile: "server/data/official/prompt1/UAE_Life_Event_Services_Detailed.xlsx",
  importedAt: new Date().toISOString(),
  verificationStatus: "verified_from_supplied_workbook",
  services
}, null, 2)}\n`);
console.log(`Imported ${services.length} Prompt 1 services to ${path.relative(process.cwd(), outputPath)}`);
