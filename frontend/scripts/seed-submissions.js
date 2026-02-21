/**
 * Seed 175 submissions into the submissions table.
 * Run from frontend directory: node scripts/seed-submissions.js
 * Loads .env.local for NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or anon key).
 */
require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const TRACKS = ["General", "RBC Track", "Uber Track", "Solo Hack", "Beginners Hack"];
const FIRST_NAMES = [
  "Alex", "Jordan", "Sam", "Taylor", "Morgan", "Casey", "Riley", "Avery",
  "Quinn", "Reese", "Jamie", "Dakota", "Skyler", "Parker", "Charlie", "Finley",
  "Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason",
  "Isabella", "William", "Mia", "James", "Charlotte", "Benjamin", "Amelia",
  "Lucas", "Harper", "Henry", "Evelyn", "Alexander", "Abigail", "Sebastian",
];
const TEAM_WORDS = [
  "Nebula", "Quantum", "Pixel", "Vector", "Syntax", "Byte", "Lambda", "Prism",
  "Flux", "Nova", "Apex", "Cipher", "Forge", "Spark", "Pulse", "Echo",
  "Vortex", "Zenith", "Atlas", "Orbit", "Nexus", "Helix", "Cortex", "Drift",
];
const PROJECT_WORDS = [
  "Smart", "Cloud", "Quick", "Safe", "Bright", "Clear", "Deep", "Fast",
  "Sync", "Link", "Hub", "Flow", "Stack", "Mesh", "Core", "Edge",
  "API", "Bot", "App", "Dash", "Kit", "Lab", "Base", "Code",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function pickN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function generateSubmission(i) {
  const numMembers = 1 + Math.floor(Math.random() * 4);
  const members = pickN(FIRST_NAMES, Math.min(numMembers, FIRST_NAMES.length));
  const numTracks = 1 + Math.floor(Math.random() * 2);
  const tracks = pickN(TRACKS, Math.min(numTracks, TRACKS.length));
  const teamName = Math.random() > 0.5
    ? `Team ${pick(TEAM_WORDS)}`
    : `The ${pick(TEAM_WORDS)}s`;
  const projectName = `${pick(PROJECT_WORDS)} ${pick(PROJECT_WORDS)}`;
  return {
    name: members[0],
    team_name: teamName,
    members,
    devpost_link: `https://devpost.com/software/seed-project-${i + 1}`,
    project_name: projectName,
    tracks,
  };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or Supabase key in .env.local");
    process.exit(1);
  }
  const supabase = createClient(url, key);
  const TOTAL = 175;
  const BATCH = 50;
  const rows = [];
  for (let i = 0; i < TOTAL; i++) {
    rows.push(generateSubmission(i));
  }
  let inserted = 0;
  for (let offset = 0; offset < rows.length; offset += BATCH) {
    const batch = rows.slice(offset, offset + BATCH);
    const { data, error } = await supabase.from("submissions").insert(batch).select("id");
    if (error) {
      console.error("Insert error:", error.message);
      process.exit(1);
    }
    inserted += (data || []).length;
    console.log(`Inserted ${inserted}/${TOTAL} submissions`);
  }
  console.log("Done. Total submissions seeded:", inserted);
}

main();
