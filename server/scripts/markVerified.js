const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline/promises");
const { spawnSync } = require("node:child_process");

const providersPath = path.join(__dirname, "..", "..", "client", "src", "data", "providers.json");
const verificationPath = path.join(__dirname, "..", "data", "providerVerification.json");
const importScriptPath = path.join(__dirname, "importProviders.js");

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseArguments(args) {
  let excludeValue = "";
  let verifiedOn = localDateString();
  for (const argument of args) {
    if (argument.startsWith("--exclude=")) excludeValue = argument.slice("--exclude=".length);
    if (argument.startsWith("--date=")) verifiedOn = argument.slice("--date=".length);
  }
  if (!isValidDate(verifiedOn)) throw new Error("--date must be a valid YYYY-MM-DD date");
  return {
    excludedIds: new Set(excludeValue.split(",").map((id) => id.trim()).filter(Boolean)),
    verifiedOn
  };
}

async function main() {
  const { excludedIds, verifiedOn } = parseArguments(process.argv.slice(2));
  const providers = JSON.parse(fs.readFileSync(providersPath, "utf8"));
  const existing = JSON.parse(fs.readFileSync(verificationPath, "utf8"));
  const entries = { ...(existing.entries || {}) };
  const markedIds = [];
  const skippedIds = [];
  let noWebsite = 0;
  let noPhone = 0;

  for (const provider of providers) {
    if (excludedIds.has(provider.id)) {
      skippedIds.push(provider.id);
      continue;
    }
    const website = typeof provider.website === "string" && provider.website.startsWith("https://")
      ? provider.website
      : "";
    const phone = typeof provider.phone === "string" && provider.phone.trim()
      ? provider.phone
      : "";
    if (!website) noWebsite += 1;
    if (!phone) noPhone += 1;
    entries[provider.id] = { website, phone, verifiedOn };
    markedIds.push(provider.id);
  }

  const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });
  let confirmation;
  try {
    confirmation = await terminal.question(
      "Confirm you checked every marked website and phone on its official site. Type yes to write verification records: "
    );
  } finally {
    terminal.close();
  }
  if (confirmation.trim() !== "yes") {
    console.log("Verification canceled; no files were written.");
    return;
  }

  fs.writeFileSync(verificationPath, `${JSON.stringify({ ...existing, entries }, null, 2)}\n`, "utf8");
  console.log(`Marked IDs: ${markedIds.length ? markedIds.join(", ") : "none"}`);
  console.log(`Skipped IDs: ${skippedIds.length ? skippedIds.join(", ") : "none"}`);
  console.log(`Providers with no website: ${noWebsite}`);
  console.log(`Providers with no phone: ${noPhone}`);

  const imported = spawnSync(process.execPath, [importScriptPath], { stdio: "inherit" });
  if (imported.error) throw imported.error;
  if (imported.status !== 0) process.exitCode = imported.status || 1;
}

main().catch((error) => {
  console.error("[mark-verified] failed:", error?.name || "Error");
  console.error(error?.message || "Unknown error");
  process.exitCode = 1;
});
