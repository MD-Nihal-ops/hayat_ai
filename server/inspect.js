const x = require("xlsx");
const w = x.readFile("data/official/facilities.xlsx");
const sheet = w.Sheets["GIS"];
const raw = x.utils.sheet_to_json(sheet, { header: 1, defval: "" });
const h = raw.findIndex((r) => r.some((c) => String(c).trim() === "Facility Name English"));
if (h < 0) process.exit();

const head = raw[h].map((c) => String(c).trim());
const rows = raw.slice(h + 1).filter((r) => r.some((c) => String(c).trim() !== "")).map((r) => Object.fromEntries(head.map((k, i) => [k, r[i]])));

const hasPair = (a) => /\d+\.\d+/.test(String(a["Coordinator"] || "") + String(a["URL Link"] || ""));
const withC = rows.filter(hasPair);
const noC = rows.filter((a) => !hasPair(a));
console.log("Facility data inspection completed.");