import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config({ path: '.env.local' });

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const result = await sql`SELECT NOW() as now`;
  console.log('✅ Task 1 — Connected to Neon:', result[0].now);
}

main().catch(console.error);
