/**
 * Clear application data from the Supabase database.
 *
 * Usage:
 *   node scripts/clear-db.js --confirm
 *   node scripts/clear-db.js --confirm --with-auth
 *
 * What it clears by default:
 * - admin_settings
 * - calendar_schedule_slots
 * - judge_investments
 * - judge_notes
 * - judge_project_assignments
 * - submissions
 * - judges
 *
 * Optional:
 * - --with-auth deletes all auth users as well. Use with extreme caution.
 */
require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")

const TABLES_IN_DELETE_ORDER = [
  "calendar_schedule_slots",
  "judge_investments",
  "judge_notes",
  "judge_project_assignments",
  "submissions",
  "judges",
  "admin_settings",
]

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
    process.exit(1)
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function clearTable(supabase, tableName) {
  const { error } = await supabase.from(tableName).delete().neq("id", "00000000-0000-0000-0000-000000000000")
  if (error) throw error
}

async function deleteAllAuthUsers(supabase) {
  let page = 1
  let deleted = 0

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error

    const users = data.users || []
    if (users.length === 0) break

    for (const user of users) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
      if (deleteError) throw deleteError
      deleted += 1
    }

    if (users.length < 1000) break
    page += 1
  }

  return deleted
}

async function main() {
  const confirmed = process.argv.includes("--confirm")
  const withAuth = process.argv.includes("--with-auth")

  if (!confirmed) {
    console.error("Refusing to run without --confirm")
    console.error("Usage: node scripts/clear-db.js --confirm [--with-auth]")
    process.exit(1)
  }

  const supabase = getClient()

  console.log("Clearing application tables...")
  for (const tableName of TABLES_IN_DELETE_ORDER) {
    await clearTable(supabase, tableName)
    console.log(`- Cleared ${tableName}`)
  }

  if (withAuth) {
    console.log("Deleting auth users...")
    const deletedUsers = await deleteAllAuthUsers(supabase)
    console.log(`- Deleted ${deletedUsers} auth user(s)`)
  } else {
    console.log("- Auth users left untouched (pass --with-auth to remove them too)")
  }

  console.log("Done.")
}

main().catch((error) => {
  console.error("Clear failed:", error.message || error)
  process.exit(1)
})
