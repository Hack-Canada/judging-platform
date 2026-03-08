/**
 * Import CSV submissions into the test_submissions table.
 *
 * Prerequisites:
 *   1. Run supabase/test-submissions-table.sql in the Supabase SQL Editor first.
 *   2. Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 *
 * Usage:
 *   node scripts/import-csv-test-submissions.js [path/to/file.csv]
 *
 * Defaults to: ../data/testing1.csv
 */
require("dotenv").config({ path: ".env.local" })
const fs = require("fs")
const path = require("path")
const { createClient } = require("@supabase/supabase-js")

const CSV_PATH = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(__dirname, "../../data/testing1.csv")

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

function extractProjects(rows) {
  const [, ...dataRows] = rows // skip header row

  // Group rows by project title (col 1)
  const byProject = new Map()

  for (const row of dataRows) {
    const get = (i) => (row[i] || "").trim()

    const title = get(1)
    if (!title || title.toLowerCase() === "untitled") continue

    if (!byProject.has(title)) {
      // First time seeing this project — capture submitter info
      const firstName = get(11)
      const lastName = get(12)
      const submitterName = [firstName, lastName].filter(Boolean).join(" ")
      const submitterEmail = get(13)
      const devpostLink = get(2)

      // Collect members: submitter first, then additional members in groups of 3
      const members = []
      if (submitterName) members.push(submitterName)

      let idx = 23
      while (idx < row.length) {
        const mFirst = get(idx)
        const mLast = get(idx + 1)
        const memberName = [mFirst, mLast].filter(Boolean).join(" ")
        if (memberName) members.push(memberName)
        idx += 3
      }

      byProject.set(title, {
        project_name: title,
        devpost_link: devpostLink || null,
        tracks: [],
        submitter_name: submitterName || null,
        submitter_email: submitterEmail || null,
        members,
      })
    }

    // Add track if non-empty and not already recorded
    const track = get(0)
    if (track) {
      const entry = byProject.get(title)
      if (!entry.tracks.includes(track)) {
        entry.tracks.push(track)
      }
    }
  }

  return Array.from(byProject.values())
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
