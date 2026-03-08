/**
 * Import a cleaned CSV into the test_submissions table.
 *
 * Prerequisites:
 *   1. Run supabase/test-submissions-table.sql in the Supabase SQL Editor first.
 *   2. Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 *   3. Generate the cleaned CSV first:
 *        node scripts/clean-devpost-csv.js ../data/your-devpost-export.csv
 *
 * Usage:
 *   node scripts/import-csv-test-submissions.js [path/to/clean.csv]
 *
 * Defaults to: ../data/new_testing_clean.csv
 *
 * The cleaned CSV must have these columns (pipe-separated tracks/members):
 *   project_name, devpost_link, tracks, submitter_name, submitter_email, members
 */
require("dotenv").config({ path: ".env.local" })
const fs = require("fs")
const path = require("path")
const { createClient } = require("@supabase/supabase-js")

const CSV_PATH = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(__dirname, "../../data/new_testing_clean.csv")

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
    process.exit(1)
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * Minimal CSV parser that handles quoted fields (including embedded commas/newlines).
 * Returns an array of string arrays (rows).
 */
function parseCsv(content) {
  const rows = []
  let row = []
  let field = ""
  let inQuotes = false

  for (let i = 0; i < content.length; i++) {
    const ch = content[i]
    const next = content[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ",") {
        row.push(field)
        field = ""
      } else if (ch === "\n") {
        row.push(field)
        field = ""
        rows.push(row)
        row = []
      } else if (ch === "\r") {
        // skip CR
      } else {
        field += ch
      }
    }
  }

  // flush last field/row
  if (field || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows
}

// Parse the cleaned CSV (columns: project_name, devpost_link, tracks, submitter_name, submitter_email, members)
function extractProjects(rows) {
  const [headerRow, ...dataRows] = rows
  const headers = headerRow.map((h) => h.trim())
  const idx = (name) => headers.indexOf(name)

  return dataRows
    .map((row) => {
      const get = (col) => (row[idx(col)] || "").trim()
      const title = get("project_name")
      if (!title) return null

      const rawTracks = get("tracks")
      const rawMembers = get("members")

      return {
        project_name:    title,
        devpost_link:    get("devpost_link") || null,
        tracks:          rawTracks ? rawTracks.split("|").map((t) => t.trim()).filter(Boolean) : [],
        submitter_name:  get("submitter_name") || null,
        submitter_email: get("submitter_email") || null,
        members:         rawMembers ? rawMembers.split("|").map((m) => m.trim()).filter(Boolean) : [],
      }
    })
    .filter(Boolean)
}

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSV not found: ${CSV_PATH}`)
    process.exit(1)
  }

  console.log(`Reading: ${CSV_PATH}`)
  const content = fs.readFileSync(CSV_PATH, "utf8")
  const rows = parseCsv(content)
  const projects = extractProjects(rows)

  console.log(`Parsed ${projects.length} unique projects from ${rows.length - 1} CSV rows`)

  const supabase = getClient()

  // Clear existing data before import to avoid stale duplicates
  console.log("Clearing existing test_submissions...")
  const { error: deleteError } = await supabase
    .from("test_submissions")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000") // delete all rows
  if (deleteError) {
    console.error("Failed to clear table:", deleteError.message)
    process.exit(1)
  }

  // Insert in batches of 20
  const BATCH = 20
  let inserted = 0
  let failed = 0

  for (let i = 0; i < projects.length; i += BATCH) {
    const batch = projects.slice(i, i + BATCH)
    const { error } = await supabase.from("test_submissions").insert(batch)
    if (error) {
      console.error(`Batch ${i}–${i + batch.length} failed:`, error.message)
      failed += batch.length
    } else {
      inserted += batch.length
    }
  }

  console.log(`Inserted: ${inserted}`)
  if (failed > 0) console.warn(`Failed: ${failed}`)
  console.log("Done.")
}

main().catch((err) => {
  console.error("Import failed:", err.message || err)
  process.exit(1)
})
