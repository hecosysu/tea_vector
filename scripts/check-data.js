const fs = require("fs");
const path = require("path");

const csvPath = path.join(__dirname, "..", "data", "example-teas.csv");
const text = fs.readFileSync(csvPath, "utf8").trim();
const [headerLine, ...rows] = text.split(/\r?\n/).filter(Boolean);
const headers = headerLine.split(",");
const scoreKeys = [
  "T01", "T02", "P01", "P02", "P03", "P04",
  "C01", "C02", "C03", "C04", "C05", "C06", "C07", "C08",
  "S01", "S02"
];
const requiredHeaders = [
  "id", "name", "category", "origin",
  ...scoreKeys,
  "confidence", "basis", "updated_at"
];
const requiredTextFields = ["id", "name", "category", "origin", "basis", "updated_at"];

let failures = 0;

for (const key of requiredHeaders) {
  if (!headers.includes(key)) {
    console.error(`Missing required header: ${key}`);
    failures += 1;
  }
}

if (failures > 0) {
  process.exit(1);
}

for (const [index, row] of rows.entries()) {
  const rowNumber = index + 2;
  const values = row.split(",");

  if (values.length !== headers.length) {
    console.error(`Row ${rowNumber}: expected ${headers.length} columns, got ${values.length}`);
    failures += 1;
    continue;
  }

  const record = Object.fromEntries(headers.map((key, i) => [key, values[i]]));
  const label = record.id || "<missing id>";

  for (const key of requiredTextFields) {
    if (!record[key] || record[key].trim() === "") {
      console.error(`Row ${rowNumber} ${label}: ${key} must not be empty`);
      failures += 1;
    }
  }

  for (const key of scoreKeys) {
    const value = Number(record[key]);
    if (!Number.isFinite(value) || value < 0 || value > 10) {
      console.error(`Row ${rowNumber} ${label}: ${key} must be 0-10, got ${record[key]}`);
      failures += 1;
    }
  }

  const confidence = Number(record.confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    console.error(`Row ${rowNumber} ${label}: confidence must be 0-1, got ${record.confidence}`);
    failures += 1;
  }
}

if (failures > 0) {
  process.exit(1);
}

console.log(`Validated ${rows.length} tea vector records.`);
