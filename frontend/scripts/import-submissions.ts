import { loadEnvConfig } from "@next/env";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { NewSubmission } from "../db/schema";

loadEnvConfig(process.cwd());

const csvPaths = [
  path.resolve(process.cwd(), "../../data/mock_submissions.csv"),
  path.resolve(process.cwd(), "data/mock_submissions.csv"),
];

async function readCsvFile() {
  for (const csvPath of csvPaths) {
    try {
      return {
        csvPath,
        file: await readFile(csvPath, "utf8"),
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  throw new Error(
    `Could not find mock_submissions.csv. Tried: ${csvPaths.join(", ")}`,
  );
}

function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        field += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(field);
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((value) => value.length > 0)) {
    rows.push(row);
  }

  return rows;
}

async function main() {
  const { csvPath, file } = await readCsvFile();
  const [header, ...records] = parseCsv(file);

  const expectedHeader = [
    "project_name",
    "devpost_link",
    "tracks",
    "submitter_name",
    "submitter_email",
    "members",
  ];

  if (header.join(",") !== expectedHeader.join(",")) {
    throw new Error(`Unexpected CSV header in ${csvPath}`);
  }

  const rows: NewSubmission[] = records.map((record, index) => {
    if (record.length !== expectedHeader.length) {
      throw new Error(
        `Row ${index + 2} has ${record.length} columns; expected ${expectedHeader.length}.`,
      );
    }

    const [
      projectName = "",
      devpostLink = "",
      tracks = "",
      submitterName = "",
      submitterEmail = "",
      members = "",
    ] = record.map((value) => value.trim());

    return {
      projectName,
      devpostLink,
      tracks,
      submitterName,
      submitterEmail,
      members,
    };
  });

  const { db, submissions } = await import("../db");

  await db.insert(submissions).values(rows);
  console.log(`Imported ${rows.length} submissions.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
