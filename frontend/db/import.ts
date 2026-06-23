import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { db } from "./index";
import { submissions } from "./schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.resolve(__dirname, "../../data/mock_submissions.csv");

type Row = {
  project_name: string;
  devpost_link: string;
  tracks: string;
  submitter_name: string;
  submitter_email: string;
  members: string;
};

const records = parse(readFileSync(csvPath, "utf-8"), {
  columns: true,        // first row becomes the keys and is skipped automatically
  skip_empty_lines: true,
}) as Row[];

const rows = records.map((r) => ({
  projectName: r.project_name ?? "",
  devpostLink: r.devpost_link ?? "",
  tracks: r.tracks ?? "",
  submitterName: r.submitter_name ?? "",
  submitterEmail: r.submitter_email ?? "",
  members: r.members ?? "",
}));

async function main() {
  await db.insert(submissions).values(rows);
  console.log(`Inserted ${rows.length} submissions`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
