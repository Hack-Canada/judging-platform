# S3 Database Backups

This repo includes a GitHub Actions workflow at `.github/workflows/db-backup.yml` that runs every 5 minutes, creates a PostgreSQL custom-format backup with `pg_dump`, and uploads both the dump and a small manifest JSON file to S3.

The workflow explicitly installs PostgreSQL 17 client tools so `pg_dump` matches the current Supabase server version.

## What It Creates

Each run produces:

- A restore-grade dump file: `postgres/YYYY/MM/DD/<timestamp>.dump`
- A manifest file with metadata and checksum: `postgres/YYYY/MM/DD/<timestamp>.json`

The default key prefix is `postgres`, but you can override it with `S3_BACKUP_PREFIX`.

## Required GitHub Secrets

Add these repository secrets before enabling the workflow:

- `SUPABASE_DB_URL`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `S3_BACKUP_BUCKET`
- `S3_BACKUP_PREFIX` (optional)

## Supabase Connection String Note

`pg_dump` needs a real PostgreSQL connection string, not the public Supabase URL and not the anon key.

For Supabase, use a Postgres connection string that works with `pg_dump`. In practice, that usually means using the direct database connection string or a session-mode connection string on port `5432`, not a transaction-pooled connection string on port `6543`.

## Local Test

You can test the backup helper locally:

```bash
cd frontend
SUPABASE_DB_URL="postgresql://USER:PASSWORD@HOST:5432/postgres" npm run backup:db
```

If your local machine has an older `pg_dump`, install PostgreSQL 17 client tools and run the script with that binary on your `PATH`.

Optional environment variables:

- `S3_BACKUP_PREFIX`
- `BACKUP_OUTPUT_DIR`

If `BACKUP_OUTPUT_DIR` is not set, the script writes to a temp directory.

## Restore Example

Download a backup from S3:

```bash
aws s3 cp "s3://YOUR_BUCKET/postgres/YYYY/MM/DD/<timestamp>.dump" ./backup.dump
```

Restore it into a target database:

```bash
pg_restore --clean --if-exists --no-owner --dbname "postgresql://USER:PASSWORD@HOST:5432/postgres" ./backup.dump
```

## Operational Notes

- The workflow also supports manual runs through `workflow_dispatch`.
- GitHub Actions cron is best-effort, so the 5-minute schedule can drift.
- The workflow is intentionally separate from the existing in-app snapshot route at `frontend/app/api/admin/backup/trigger/route.ts`.
