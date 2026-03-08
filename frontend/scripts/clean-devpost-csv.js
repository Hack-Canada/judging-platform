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

const [headerRow, ...dataRows] = rows
const get = (row, i) => (i < row.length ? row[i] : "").trim()

// Auto-detect format by reading header names
// Format A (testing1.csv):  col0=Opt-In Prize, col1=Project Title, one row per track
// Format B (new_testing.csv): col0=Project Title, col9=Opt-In Prizes, one row per project
const colIdx = {}
headerRow.forEach((h, i) => { colIdx[h.trim()] = i })

const isTitleFirst = headerRow[0].trim() === "Project Title"
const titleCol = isTitleFirst ? 0 : 1
const devpostCol = isTitleFirst ? 1 : 2
const tracksCol = isTitleFirst ? (colIdx["Opt-In Prizes"] ?? 9) : 0
const firstNameCol = colIdx["Submitter First Name"] ?? 11
const lastNameCol = colIdx["Submitter Last Name"] ?? 12
const emailCol = colIdx["Submitter Email"] ?? 13
const memberStartCol = colIdx["Team Member 1 First Name"] ?? 23

console.log(`Detected format: ${isTitleFirst ? "B (one row per project)" : "A (one row per track)"}`)

const byProject = new Map()

for (const row of dataRows) {
  const title = get(row, titleCol)
  if (!title || title.toLowerCase() === "untitled" || title.toLowerCase() === "w") continue

  if (!byProject.has(title)) {
    const firstName = get(row, firstNameCol)
    const lastName = get(row, lastNameCol)
    const submitterName = [firstName, lastName].filter(Boolean).join(" ")

    const members = []
    if (submitterName) members.push(submitterName)

    let idx = memberStartCol
    while (idx < row.length) {
      const mFirst = get(row, idx)
      const mLast = get(row, idx + 1)
      const name = [mFirst, mLast].filter(Boolean).join(" ")
      if (name) members.push(name)
      idx += 3
    }

    byProject.set(title, {
      project_name: title,
      devpost_link: get(row, devpostCol),
      tracks: [],
      submitter_name: submitterName,
      submitter_email: get(row, emailCol),
      members,
    })
  }

  const entry = byProject.get(title)

  const isMLH = (t) => t.toLowerCase().startsWith("[mlh]") || t.toLowerCase().startsWith("mlh ")

  if (isTitleFirst) {
    // Format B: all tracks are comma-separated in one cell
    const rawTracks = get(row, tracksCol)
    rawTracks.split(",").map(t => t.trim()).filter(Boolean).forEach(t => {
      if (!isMLH(t) && !entry.tracks.includes(t)) entry.tracks.push(t)
    })
  } else {
    // Format A: one track per row
    const track = get(row, tracksCol)
    if (track && !isMLH(track) && !entry.tracks.includes(track)) entry.tracks.push(track)
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
