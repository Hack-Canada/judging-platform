import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// This file is pre-wired. You just need to add DATABASE_URL to .env.local.
const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });
