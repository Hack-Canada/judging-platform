/**
 * Clean a raw Devpost CSV export into a simplified submissions CSV.
 *
 * Usage:
 *   node scripts/clean-devpost-csv.js <input.csv> [output.csv]
 *
 * Examples:
 *   node scripts/clean-devpost-csv.js ../data/testing1.csv
 *   node scripts/clean-devpost-csv.js ../data/testing1.csv ../data/submissions_clean.csv
 *
 * Output columns:
 *   project_name, devpost_link, tracks, submitter_name, submitter_email, members
 *
 * Notes:
 *   - tracks and members are pipe-separated (|)
 *   - projects titled "Untitled" are skipped
 *   - multiple rows for the same project (one per track) are merged
 *   - output defaults to same directory as input, named submissions_clean.csv
 */

const fs = require("fs")
const path = require("path")

const inputPath = process.argv[2]
if (!inputPath) {
  console.error("Usage: node scripts/clean-devpost-csv.js <input.csv> [output.csv]")
  process.exit(1)
}

const resolvedInput = path.resolve(inputPath)
if (!fs.existsSync(resolvedInput)) {
  console.error(`File not found: ${resolvedInput}`)
  process.exit(1)
}

const outputPath = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.join(path.dirname(resolvedInput), "submissions_clean.csv")

console.log(`Reading: ${resolvedInput}`)
const content = fs.readFileSync(resolvedInput, "utf8")

function parseCsv(text) {
  const rows = []
  let row = [], field = "", inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1]
    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i++ }
      else if (ch === '"') inQuotes = false
      else field += ch
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === ',') { row.push(field); field = "" }
      else if (ch === '\n') { row.push(field); field = ""; rows.push(row); row = [] }
      else if (ch !== '\r') field += ch
    }
  }
  if (field || row.length > 0) { row.push(field); rows.push(row) }
  return rows
}

const rows = parseCsv(content).filter(r => r.some(f => f.trim()))

const [, ...dataRows] = rows // skip header

const get = (row, i) => (i < row.length ? row[i] : "").trim()

const byProject = new Map()

for (const row of dataRows) {
  const title = get(row, 1)
  if (!title || title.toLowerCase() === "untitled") continue

  if (!byProject.has(title)) {
    const firstName = get(row, 11)
    const lastName = get(row, 12)
    const submitterName = [firstName, lastName].filter(Boolean).join(" ")

    const members = []
    if (submitterName) members.push(submitterName)

    let idx = 23
    while (idx < row.length) {
      const mFirst = get(row, idx)
      const mLast = get(row, idx + 1)
      const name = [mFirst, mLast].filter(Boolean).join(" ")
      if (name) members.push(name)
      idx += 3
    }

    byProject.set(title, {
      project_name: title,
      devpost_link: get(row, 2),
      tracks: [],
      submitter_name: submitterName,
      submitter_email: get(row, 13),
      members,
    })
  }

  const track = get(row, 0)
  const entry = byProject.get(title)
  if (track && !entry.tracks.includes(track)) {
    entry.tracks.push(track)
  }
}

const header = ["project_name", "devpost_link", "tracks", "submitter_name", "submitter_email", "members"]

function escapeCsvField(value) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

const lines = [header.join(",")]
for (const p of byProject.values()) {
  const row = [
    p.project_name,
    p.devpost_link,
    p.tracks.join("|"),
    p.submitter_name,
    p.submitter_email,
    p.members.join("|"),
  ].map(escapeCsvField)
  lines.push(row.join(","))
}

fs.writeFileSync(outputPath, lines.join("\n"), "utf8")
console.log(`Written ${byProject.size} projects to: ${outputPath}`)
