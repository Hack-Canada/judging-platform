import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { db } from "../db";
import { submissions } from "../db/schema";

async function importDevPost() {
  console.log("📥 Importing DevPost submissions...");

  const csvPath = path.resolve(__dirname, "../../data/mock_submissions.csv");
  const content = fs.readFileSync(csvPath, "utf-8");
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",");

  console.log(`   Found ${lines.length - 1} rows`);

  const rows = lines.slice(1).map((line) => {
    // Handle quoted CSV fields
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    return {
      projectName: values[0] ?? "",
      devpostLink: values[1] ?? "",
      tracks: values[2] ?? "",
      submitterName: values[3] ?? "",
      submitterEmail: values[4] ?? "",
      members: values[5] ?? "",
    };
  }).filter((r) => r.projectName);

  await db.insert(submissions).values(rows);

  console.log(`✅ Imported ${rows.length} submissions`);
  process.exit(0);
}

importDevPost().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
