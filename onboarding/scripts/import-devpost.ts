// ============================================================
// TASK 3: Import DevPost submissions into your database
// ============================================================
//
// The CSV lives at: ../../data/final_clean_with_general.csv
// (relative to this file, i.e. two levels up from onboarding/)
//
// Columns: project_name, devpost_link, tracks, submitter_name,
//          submitter_email, members
//
// Steps:
//  1. Read the CSV file using Node's built-in `fs` module
//  2. Parse it line by line — skip the header row
//  3. Use db.insert(submissions).values([...]) to bulk-insert all rows
//  4. Log how many rows were inserted
//
// Tips:
//  - Use `fs.readFileSync` + `.split("\n")` + `.split(",")` for basic parsing
//  - Watch out for rows where `tracks` or `members` contain commas inside
//    quotes — look at the raw CSV first with `head -5 ../../data/final_clean_with_general.csv`
//  - AI is encouraged: ask it to help you write a CSV parser or handle edge cases
//
// Run with: npm run import
// ============================================================

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";

async function importDevPost() {
  console.log("📥 Importing DevPost submissions...");

  const csvPath = path.resolve(__dirname, "../../data/final_clean_with_general.csv");

  // TODO: Read and parse the CSV
  // TODO: Import db and submissions table from @/db
  // TODO: Insert all rows into the database

  console.log("✅ Import complete!");
  process.exit(0);
}

importDevPost().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
