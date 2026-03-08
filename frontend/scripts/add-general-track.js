/**
 * Add "General" to the tracks array of every test_submission that doesn't already have it.
 *
 * Usage:
 *   node scripts/add-general-track.js
 */
require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")

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

async function main() {
  const supabase = getClient()

  const { data: rows, error } = await supabase
    .from("test_submissions")
    .select("id, tracks")

  if (error) {
    console.error("Failed to fetch submissions:", error.message)
    process.exit(1)
  }

  console.log(`Processing all ${rows.length} submissions...`)

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const row of rows) {
    // Skip if already has General (no duplicate)
    if (Array.isArray(row.tracks) && row.tracks.includes("General")) {
      skipped++
      continue
    }
    const newTracks = Array.isArray(row.tracks) ? [...row.tracks, "General"] : ["General"]
    const { error: updateError } = await supabase
      .from("test_submissions")
      .update({ tracks: newTracks })
      .eq("id", row.id)

    if (updateError) {
      console.error(`Failed to update ${row.id}:`, updateError.message)
      failed++
    } else {
      updated++
    }
  }

  console.log(`Done. Added "General" to ${updated} project(s). ${skipped} already had it. All ${rows.length} projects now have "General".${failed > 0 ? ` Failed: ${failed}` : ""}`)
}

main().catch((err) => {
  console.error("Script failed:", err.message || err)
  process.exit(1)
})
