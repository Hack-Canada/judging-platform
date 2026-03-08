/**
 * Seed a fixed set of specialist judges / sponsors into public.judges.
 *
 * Usage:
 *   node scripts/seed-specialist-judges.js
 *
 * Notes:
 * - This script upserts rows in public.judges only.
 * - It does not create auth users because the current Supabase auth policy
 *   rejects 4-digit passwords, while judge/sponsor login in this app expects a PIN.
 * - If you want these users to log in later, create matching auth accounts separately
 *   once the auth password policy matches the 4-digit PIN flow.
 */
require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")

const SPECIALIST_JUDGES = [
  {
    label: "MLH 1",
    name: "MLH Judge 1",
    email: "mlh.judge.1@hackcanada.test",
    tracks: [
      "[MLH] Best Use of Solana",
      "[MLH] Best Use of Presage",
      "[MLH] Best Use of Vultr",
      "[MLH] Best Use of Auth0",
    ],
  },
  {
    label: "MLH 2",
    name: "MLH Judge 2",
    email: "mlh.judge.2@hackcanada.test",
    tracks: [
      "[MLH] Best Hack Built with Google Antigravity",
      "[MLH] Best Use of Gemini API",
      "MLH x ElevenLabs - Best Project Built with ElevenLabs",
    ],
  },
  {
    label: "Ordinary judge",
    name: "Ordinary Judge",
    email: "ordinary.judge@hackcanada.test",
    tracks: ["General"],
  },
  {
    label: "Vivirion sponsor",
    name: "Vivirion Sponsor",
    email: "vivirion.sponsor@hackcanada.test",
    tracks: ["Vivirion Solutions - Best Practical Healthcare Hack"],
  },
  {
    label: "Tailscale sponsor",
    name: "Tailscale Sponsor",
    email: "tailscale.sponsor@hackcanada.test",
    tracks: ["Tailscale Integration Challenge"],
  },
  {
    label: "Reactiv sponsor",
    name: "Reactiv Sponsor",
    email: "reactiv.sponsor@hackcanada.test",
    tracks: ["Reactiv - ClipKit Lab"],
  },
  {
    label: "Laurier WebXR sponsor",
    name: "Laurier Uni WebXR Sponsor",
    email: "laurier.webxr@hackcanada.test",
    tracks: ["Best Virtual Reality & WebXR Hack: Immersive Experiences for the Open Web"],
  },
  {
    label: "Arihan AI judge",
    name: "Arihan",
    email: "arihan.ai@hackcanada.test",
    tracks: ["Most technically complex AI hack"],
  },
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

async function upsertJudgeRow(supabase, judge) {
  const normalizedEmail = judge.email.trim().toLowerCase()
  const { data: existingRows, error: selectError } = await supabase
    .from("judges")
    .select("id")
    .ilike("email", normalizedEmail)
    .limit(1)

  if (selectError) throw selectError

  if (existingRows && existingRows.length > 0) {
    const existing = existingRows[0]
    const { error: updateError } = await supabase
      .from("judges")
      .update({
        name: judge.name,
        email: normalizedEmail,
        tracks: judge.tracks,
      })
      .eq("id", existing.id)

    if (updateError) throw updateError
    return "updated"
  }

  const { error: insertError } = await supabase.from("judges").insert({
    name: judge.name,
    email: normalizedEmail,
    tracks: judge.tracks,
    assigned_projects: 0,
    total_invested: 0,
  })

  if (insertError) throw insertError
  return "inserted"
}

async function main() {
  const supabase = getClient()
  let inserted = 0
  let updated = 0

  console.log(`Seeding ${SPECIALIST_JUDGES.length} specialist judge/sponsor rows...`)

  for (const judge of SPECIALIST_JUDGES) {
    const result = await upsertJudgeRow(supabase, judge)
    if (result === "inserted") inserted += 1
    if (result === "updated") updated += 1

    console.log(`- ${judge.label}: ${judge.name} <${judge.email}>`)
    console.log(`  tracks: ${judge.tracks.join(" | ")}`)
  }

  console.log(`Inserted: ${inserted}`)
  console.log(`Updated: ${updated}`)
  console.log("Done.")
  console.log("Note: This script only syncs public.judges rows and does not create auth login accounts.")
}

main().catch((error) => {
  console.error("Specialist judge seed failed:", error.message || error)
  process.exit(1)
})
