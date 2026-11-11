const fs = require("node:fs");
const path = require("node:path");

const serverDirectory = path.join(__dirname, "..");
const pdfPath = path.join(serverDirectory, "data", "official", "medicines.pdf");
const outputPath = path.join(serverDirectory, "data", "registeredMedicines.json");
const columnNames = [
  "name",
  "form",
  "strength",
  "manufacturer",
  "manufacturerCountry",
  "mah",
  "mahCountry"
];

function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function groupItemsIntoLines(items) {
  const lines = [];
  for (const item of items) {
    const text = typeof item.str === "string" ? item.str.trim() : "";
    if (!text || !item.transform) continue;
    const x = item.transform[4];
    const y = item.transform[5];
    let line = lines.find((candidate) => Math.abs(candidate.y - y) <= 1.5);
    if (!line) {
      line = { y, items: [] };
      lines.push(line);
    }
    line.items.push({ x, str: text });
  }
  for (const line of lines) {
    line.items.sort((a, b) => a.x - b.x);
    line.text = line.items.map((item) => item.str).join(" ");
  }
  return lines.sort((a, b) => b.y - a.y);
}

function headerColumns(lines) {
  const packLine = lines.find((line) => {
    const words = line.text.toUpperCase().split(/\s+/);
    return ["PACK", "FORM", "STRENGTH", "MANUFACTURER"].every((word) => words.includes(word));
  });
  if (!packLine) return null;

  const headerItems = lines
    .filter((line) => Math.abs(line.y - packLine.y) <= 28)
    .flatMap((line) => line.items);
  const findHeaderX = (word, predicate = () => true) =>
    headerItems.find((item) => item.str.toUpperCase() === word && predicate(item))?.x;
  const packX = findHeaderX("PACK");
  const formX = findHeaderX("FORM");
  const strengthX = findHeaderX("STRENGTH");
  const manufacturerX = findHeaderX("MANUFACTURER");
  const countryXs = headerItems
    .filter((item) => item.str.toUpperCase() === "COUNTRY")
    .map((item) => item.x)
    .filter((x) => x > manufacturerX)
    .sort((a, b) => a - b);
  const mahX = headerItems.find((item) =>
    ["MARKET", "MAH"].includes(item.str.toUpperCase()) && item.x > manufacturerX
  )?.x;
  if (
    [packX, formX, strengthX, manufacturerX, countryXs[0], mahX, countryXs[1]]
      .some((value) => !Number.isFinite(value))
  ) {
    return null;
  }

  return {
    y: packLine.y,
    text: lines
      .filter((line) => line.y >= packLine.y - 1 && line.y <= packLine.y + 28)
      .map((line) => line.items.map((item) => item.str).join(" "))
      .join(" "),
    starts: [packX, formX, strengthX, manufacturerX, countryXs[0], mahX, countryXs[1]]
  };
}

function columnIndex(x, starts) {
  for (let index = starts.length - 1; index > 0; index -= 1) {
    const boundary = (starts[index - 1] + starts[index]) / 2;
    if (x >= boundary) return index;
  }
  return 0;
}

function cleanRow(row) {
  const joinColumn = (parts) => parts.reduce((value, part) => {
    const text = part.trim();
    if (!value) return text;
    if (/^[a-z]{1,2}$/.test(text) && /[a-z]$/.test(value)) {
      return `${value}${text}`;
    }
    return `${value} ${text}`;
  }, "").replace(/\s+/g, " ").trim();
  return Object.fromEntries(columnNames.map((name) => [
    name,
    joinColumn(row[name])
  ]));
}

function isRepeatedHeader(line) {
  const text = line.text.toUpperCase();
  return /\bPACK\b/.test(text) &&
    /\bFORM\b/.test(text) &&
    /\bSTRENGTH\b/.test(text) &&
    /\bMANUFACTURER\b/.test(text);
}

function extractRows(lines, columns) {
  const dataLines = lines.filter((line) =>
    line.y < columns.y - 5 &&
    line.y > 50 &&
    !isRepeatedHeader(line)
  );
  const gaps = dataLines.slice(1).map((line, index) =>
    dataLines[index].y - line.y
  ).filter((gap) => gap > 0);
  const gapThreshold = median(gaps) * 1.5;
  const rows = [];
  let current = null;
  let previousY = null;

  const flush = () => {
    if (!current) return;
    const row = cleanRow(current);
    if (row.name) rows.push(row);
    current = null;
  };

  for (const line of dataLines) {
    const parts = Array.from({ length: columnNames.length }, () => []);
    for (const item of line.items) {
      parts[columnIndex(item.x, columns.starts)].push(item.str);
    }

    const lineColumns = parts.map((items) => items.join(" "));
    const gapStartsRow = previousY !== null &&
      previousY - line.y > gapThreshold;
    if (gapStartsRow) {
      flush();
    }
    if (!current) {
      current = Object.fromEntries(columnNames.map((name) => [name, []]));
    }
    const hadName = current.name.length > 0;
    const hadForm = current.form.length > 0;
    lineColumns.forEach((value, index) => {
      if (value) current[columnNames[index]].push(value);
    });
    if (lineColumns[0] && (lineColumns[1] || (hadForm && !hadName))) {
      flush();
    }
    previousY = line.y;
  }
  flush();
  return rows;
}

async function main() {
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`Registered medicines PDF not found: ${pdfPath}`);
  }
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(fs.readFileSync(pdfPath))
  });
  const document = await loadingTask.promise;
  let columns = null;
  let headerText = "";
  const medicines = [];

  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const lines = groupItemsIntoLines(content.items);
      const foundColumns = headerColumns(lines);
      if (foundColumns) {
        columns = foundColumns;
        if (!headerText) headerText = foundColumns.text;
      }
      if (!columns) {
        throw new Error(`No medicine table header found on or before page ${pageNumber}`);
      }
      medicines.push(...extractRows(lines, columns));
    }
  } finally {
    await loadingTask.destroy();
  }

  fs.writeFileSync(outputPath, `${JSON.stringify(medicines, null, 2)}\n`, "utf8");
  const emptyFormCount = medicines.filter((medicine) => !medicine.form).length;
  console.log(`Pages: ${document.numPages}`);
  console.log(`Rows: ${medicines.length}`);
  console.log(`Rows with an empty form: ${emptyFormCount}`);
  console.log("Medicine import completed.");
}

main().catch((error) => {
  console.error("[import-medicines] failed:", error?.name || "Error");
  process.exitCode = 1;
});
