/**
 * Seed ~150 random submissions into the submissions table.
 * Run from frontend directory: node scripts/seed-150-submissions.js
 * 
 * To undo: node scripts/seed-150-submissions.js --undo
 * 
 * Loads .env.local for NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const SEED_LOG_FILE = path.join(__dirname, ".seed-150-ids.json");

const TRACKS = [
  "General",
  "Most technically complex AI hack",
  "Best Virtual Reality & WebXR Hack: Immersive Experiences for the Open Web",
  "Reactiv - ClipKit Lab",
  "Tailscale Integration Challenge",
  "Stan - Build in Public, Win in Public",
  "Cloudinary Challenge",
  "Backboard.io - Best use of Backboard",
  "Vivirion Solutions - Best Practical Healthcare Hack",
  "MLH x ElevenLabs - Best Project Built with ElevenLabs",
  "[MLH] Best Hack Built with Google Antigravity",
  "[MLH] Best Use of Gemini API",
  "[MLH] Best Use of Solana",
  "[MLH] Best Use of Vultr",
  "[MLH] Best Use of Auth0",
];

const FIRST_NAMES = [
  "Alex", "Jordan", "Sam", "Taylor", "Morgan", "Casey", "Riley", "Avery",
  "Quinn", "Reese", "Jamie", "Dakota", "Skyler", "Parker", "Charlie", "Finley",
  "Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason",
  "Isabella", "William", "Mia", "James", "Charlotte", "Benjamin", "Amelia",
  "Lucas", "Harper", "Henry", "Evelyn", "Alexander", "Abigail", "Sebastian",
  "Emily", "Daniel", "Elizabeth", "Matthew", "Sofia", "David", "Ella",
  "Joseph", "Grace", "Michael", "Chloe", "Andrew", "Victoria", "Joshua",
  "Lily", "Christopher", "Zoey", "Nathan", "Penelope", "Ryan", "Layla",
  "Kevin", "Aria", "Brandon", "Nora", "Justin", "Mila", "Tyler", "Aubrey",
  "Aiden", "Hannah", "Dylan", "Scarlett", "Jason", "Eleanor", "Eric", "Madison",
  "Aaron", "Leah", "Adam", "Stella", "Brian", "Violet", "Cameron", "Hazel",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
  "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter",
];

const TEAM_PREFIXES = [
  "Team", "The", "Project", "Squad", "Crew", "Code", "Hack", "Dev", "Tech", "Digital",
];

const TEAM_WORDS = [
  "Nebula", "Quantum", "Pixel", "Vector", "Syntax", "Byte", "Lambda", "Prism",
  "Flux", "Nova", "Apex", "Cipher", "Forge", "Spark", "Pulse", "Echo",
  "Vortex", "Zenith", "Atlas", "Orbit", "Nexus", "Helix", "Cortex", "Drift",
  "Phoenix", "Thunder", "Storm", "Lightning", "Dragon", "Falcon", "Eagle", "Wolf",
  "Tiger", "Lion", "Shark", "Cobra", "Ninja", "Wizard", "Rocket", "Comet",
  "Galaxy", "Cosmos", "Stellar", "Solar", "Lunar", "Aurora", "Infinity", "Matrix",
];

const TEAM_SUFFIXES = [
  "s", " Labs", " Co", " Tech", " Dev", " Squad", " Crew", " Collective", " Dynamics", "",
];

const PROJECT_ADJECTIVES = [
  "Smart", "Cloud", "Quick", "Safe", "Bright", "Clear", "Deep", "Fast",
  "Open", "Auto", "Easy", "Super", "Ultra", "Hyper", "Mega", "Neo",
  "Meta", "Cyber", "Quantum", "Neural", "Crypto", "Eco", "Bio", "Geo",
  "Social", "Mobile", "Virtual", "Instant", "Dynamic", "Adaptive", "Intelligent", "Connected",
];

const PROJECT_NOUNS = [
  "Sync", "Link", "Hub", "Flow", "Stack", "Mesh", "Core", "Edge",
  "API", "Bot", "App", "Dash", "Kit", "Lab", "Base", "Code",
  "Mind", "Pulse", "Wave", "Path", "Grid", "Node", "Chain", "Bridge",
  "Space", "Forge", "Scope", "Track", "Guard", "Shield", "Vault", "Gate",
  "Lens", "Eye", "Voice", "Talk", "Chat", "Meet", "Share", "Learn",
];

const PROJECT_SUFFIXES = [
  "", "AI", "Pro", "Plus", "X", "2.0", "Go", "Now", "One", "Max", "Lite", "360",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

function generateFullName() {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

function generateTeamName() {
  const style = Math.random();
  if (style < 0.3) {
    return `${pick(TEAM_PREFIXES)} ${pick(TEAM_WORDS)}`;
  } else if (style < 0.6) {
    return `${pick(TEAM_WORDS)}${pick(TEAM_SUFFIXES)}`;
  } else if (style < 0.8) {
    return `${pick(TEAM_WORDS)} ${pick(TEAM_WORDS)}`;
  } else {
    return `The ${pick(TEAM_WORDS)}${pick(TEAM_SUFFIXES)}`;
  }
}

function generateProjectName() {
  const style = Math.random();
  if (style < 0.4) {
    return `${pick(PROJECT_ADJECTIVES)}${pick(PROJECT_NOUNS)}${pick(PROJECT_SUFFIXES)}`;
  } else if (style < 0.7) {
    return `${pick(PROJECT_ADJECTIVES)} ${pick(PROJECT_NOUNS)}`;
  } else {
    return `${pick(PROJECT_NOUNS)}${pick(PROJECT_SUFFIXES)}`;
  }
}

function generateSubmission(index) {
  // Number of members: 1-4, weighted towards 2-3
  const memberWeights = [0.15, 0.35, 0.35, 0.15]; // 1, 2, 3, 4 members
  const rand = Math.random();
  let numMembers = 1;
  let cumulative = 0;
  for (let i = 0; i < memberWeights.length; i++) {
    cumulative += memberWeights[i];
    if (rand < cumulative) {
      numMembers = i + 1;
      break;
    }
  }

  const members = [];
  for (let i = 0; i < numMembers; i++) {
    members.push(generateFullName());
  }

  // Number of tracks: 1-4, weighted towards 1-2
  const trackWeights = [0.4, 0.35, 0.15, 0.1]; // 1, 2, 3, 4 tracks
  const trackRand = Math.random();
  let numTracks = 1;
  cumulative = 0;
  for (let i = 0; i < trackWeights.length; i++) {
    cumulative += trackWeights[i];
    if (trackRand < cumulative) {
      numTracks = i + 1;
      break;
    }
  }

  const tracks = pickN(TRACKS, numTracks);
  const teamName = generateTeamName();
  const projectName = generateProjectName();

  return {
    name: members[0],
    team_name: teamName,
    members,
    devpost_link: `https://devpost.com/software/seeded-project-${index + 1}-${Date.now().toString(36)}`,
    project_name: projectName,
    tracks,
  };
}

async function seedSubmissions(supabase, count) {
  console.log(`\nSeeding ${count} submissions...\n`);

  const rows = [];
  for (let i = 0; i < count; i++) {
    rows.push(generateSubmission(i));
  }

  const BATCH_SIZE = 50;
  const insertedIds = [];
  let inserted = 0;

  for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
    const batch = rows.slice(offset, offset + BATCH_SIZE);
    const { data, error } = await supabase.from("submissions").insert(batch).select("id");

    if (error) {
      console.error("Insert error:", error.message);
      // Save partial IDs before exiting
      if (insertedIds.length > 0) {
        fs.writeFileSync(SEED_LOG_FILE, JSON.stringify({ ids: insertedIds, timestamp: new Date().toISOString() }));
        console.log(`Saved ${insertedIds.length} IDs to ${SEED_LOG_FILE} for cleanup`);
      }
      process.exit(1);
    }

    const ids = (data || []).map((row) => row.id);
    insertedIds.push(...ids);
    inserted += ids.length;
    console.log(`Inserted ${inserted}/${count} submissions`);
  }

  // Save IDs for undo
  fs.writeFileSync(SEED_LOG_FILE, JSON.stringify({ ids: insertedIds, timestamp: new Date().toISOString() }, null, 2));
  console.log(`\nDone! Seeded ${inserted} submissions.`);
  console.log(`IDs saved to ${SEED_LOG_FILE}`);
  console.log(`\nTo undo: node scripts/seed-150-submissions.js --undo`);
}

async function undoSubmissions(supabase) {
  if (!fs.existsSync(SEED_LOG_FILE)) {
    console.error(`No seed log file found at ${SEED_LOG_FILE}`);
    console.error("Nothing to undo.");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(SEED_LOG_FILE, "utf-8"));
  const ids = data.ids || [];

  if (ids.length === 0) {
    console.log("No IDs found in seed log. Nothing to undo.");
    process.exit(0);
  }

  console.log(`\nFound ${ids.length} seeded submissions from ${data.timestamp}`);
  console.log("Deleting...\n");

  const BATCH_SIZE = 50;
  let deleted = 0;

  for (let offset = 0; offset < ids.length; offset += BATCH_SIZE) {
    const batch = ids.slice(offset, offset + BATCH_SIZE);
    const { error, count } = await supabase.from("submissions").delete().in("id", batch);

    if (error) {
      console.error("Delete error:", error.message);
      // Update the log with remaining IDs
      const remainingIds = ids.slice(offset);
      fs.writeFileSync(SEED_LOG_FILE, JSON.stringify({ ids: remainingIds, timestamp: data.timestamp }, null, 2));
      console.log(`Updated seed log with ${remainingIds.length} remaining IDs`);
      process.exit(1);
    }

    deleted += batch.length;
    console.log(`Deleted ${deleted}/${ids.length} submissions`);
  }

  // Remove the log file
  fs.unlinkSync(SEED_LOG_FILE);
  console.log(`\nDone! Deleted ${deleted} submissions.`);
  console.log(`Removed seed log file.`);
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or Supabase key in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const args = process.argv.slice(2);
  const isUndo = args.includes("--undo") || args.includes("-u");
  const countArg = args.find((arg) => !arg.startsWith("-"));
  const count = countArg ? parseInt(countArg, 10) : 150;

  if (isUndo) {
    await undoSubmissions(supabase);
  } else {
    if (isNaN(count) || count < 1) {
      console.error("Invalid count. Usage: node scripts/seed-150-submissions.js [count]");
      process.exit(1);
    }
    await seedSubmissions(supabase, count);
  }
}

main();
