import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";

loadEnvConfig(process.cwd());

async function main() {
  const connectionString =
    process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL or NEON_DATABASE_URL must be set.");
  }

  const sql = neon(connectionString);
  const result = await sql`SELECT NOW()`;
  console.log(result);
}

main();
