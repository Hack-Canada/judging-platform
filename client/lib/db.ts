import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Lazy initialization: `neon()` throws if DATABASE_URL is unset, and Next.js
// evaluates top-level module code at build time. Initializing inside a function
// keeps `next build` from crashing before the env var is configured.
let _sql: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Add your Neon connection string to client/.env.local"
      );
    }
    _sql = neon(url);
  }
  return _sql;
}
