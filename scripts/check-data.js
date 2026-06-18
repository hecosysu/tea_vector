const fs = require("fs");
const path = require("path");

let failures = 0;

function fail(message) {
  console.error(message);
  failures += 1;
}

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

for (const key of requiredHeaders) {
  if (!headers.includes(key)) {
    fail(`Missing required header: ${key}`);
  }
}

if (failures === 0) {
  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const values = row.split(",");

    if (values.length !== headers.length) {
      fail(`Row ${rowNumber}: expected ${headers.length} columns, got ${values.length}`);
      continue;
    }

    const record = Object.fromEntries(headers.map((key, i) => [key, values[i]]));
    const label = record.id || "<missing id>";

    for (const key of requiredTextFields) {
      if (!record[key] || record[key].trim() === "") {
        fail(`Row ${rowNumber} ${label}: ${key} must not be empty`);
      }
    }

    for (const key of scoreKeys) {
      const value = Number(record[key]);
      if (!Number.isFinite(value) || value < 0 || value > 10) {
        fail(`Row ${rowNumber} ${label}: ${key} must be 0-10, got ${record[key]}`);
      }
    }

    const confidence = Number(record.confidence);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      fail(`Row ${rowNumber} ${label}: confidence must be 0-1, got ${record.confidence}`);
    }
  }
}

const wikipediaPath = path.join(__dirname, "..", "data", "wikipedia-tea-topology.json");
const wikipediaTopology = JSON.parse(fs.readFileSync(wikipediaPath, "utf8"));
const requiredWikipediaFields = ["id", "label_en", "type", "topology_domain", "wikipedia_url"];

if (!Array.isArray(wikipediaTopology.entries)) {
  fail("Wikipedia topology: entries must be an array");
} else {
  if (wikipediaTopology.entries.length < 60) {
    fail(`Wikipedia topology: expected at least 60 entries, got ${wikipediaTopology.entries.length}`);
  }

  const ids = new Set();
  for (const [index, entry] of wikipediaTopology.entries.entries()) {
    const label = entry.id || `<entry ${index + 1}>`;

    for (const key of requiredWikipediaFields) {
      if (typeof entry[key] !== "string" || entry[key].trim() === "") {
        fail(`Wikipedia topology ${label}: ${key} must not be empty`);
      }
    }

    if (entry.id) {
      if (ids.has(entry.id)) {
        fail(`Wikipedia topology ${label}: duplicate id`);
      }
      ids.add(entry.id);
    }

    if (entry.wikipedia_url && !entry.wikipedia_url.startsWith("https://en.wikipedia.org/wiki/")) {
      fail(`Wikipedia topology ${label}: wikipedia_url must start with https://en.wikipedia.org/wiki/`);
    }
  }
}

if (failures > 0) {
  process.exit(1);
}

console.log(`Validated ${rows.length} tea vector records.`);
console.log(`Validated ${wikipediaTopology.entries.length} Wikipedia topology entries.`);
