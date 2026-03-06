/**
 * Create a restore-grade PostgreSQL backup with pg_dump.
 *
 * Usage:
 *   node scripts/db-backup.js
 *   SUPABASE_DB_URL=postgresql://... node scripts/db-backup.js
 *
 * Environment:
 *   SUPABASE_DB_URL or DATABASE_URL  Required. Connection string for pg_dump.
 *   S3_BACKUP_PREFIX                 Optional. Defaults to "postgres".
 *   BACKUP_OUTPUT_DIR                Optional. Defaults to an OS temp directory.
 */
const crypto = require("crypto")
const fs = require("fs")
const os = require("os")
const path = require("path")
const { spawnSync } = require("child_process")

function printHelp() {
  console.log(`Create a PostgreSQL custom-format backup with pg_dump.

Usage:
  node scripts/db-backup.js

Environment:
  SUPABASE_DB_URL or DATABASE_URL  Required. Database connection string.
  S3_BACKUP_PREFIX                 Optional. S3 key prefix. Default: postgres
  BACKUP_OUTPUT_DIR                Optional. Local output directory.

Outputs:
  dump_path
  manifest_path
  s3_dump_key
  s3_manifest_key
  dump_size_bytes
  dump_sha256
`)
}

function loadLocalEnvFile() {
  const envPath = path.resolve(__dirname, "..", ".env.local")
  if (!fs.existsSync(envPath)) return

  const raw = fs.readFileSync(envPath, "utf8")
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    const equalsIndex = trimmed.indexOf("=")
    if (equalsIndex === -1) continue

    const key = trimmed.slice(0, equalsIndex).trim()
    let value = trimmed.slice(equalsIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

function getDatabaseUrl() {
  return process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || ""
}

function getTimestampParts(date) {
  const year = String(date.getUTCFullYear())
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  const timestamp = date.toISOString().replace(/:/g, "-").replace(/\.\d{3}Z$/, "Z")

  return { year, month, day, timestamp }
}

function appendGitHubOutput(name, value) {
  const outputPath = process.env.GITHUB_OUTPUT
  if (!outputPath) return
  fs.appendFileSync(outputPath, `${name}=${value}\n`)
}

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256")
    const stream = fs.createReadStream(filePath)

    stream.on("data", (chunk) => hash.update(chunk))
    stream.on("error", reject)
    stream.on("end", () => resolve(hash.digest("hex")))
  })
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printHelp()
    return
  }

  loadLocalEnvFile()

  const databaseUrl = getDatabaseUrl()
  if (!databaseUrl) {
    console.error("Missing SUPABASE_DB_URL or DATABASE_URL.")
    console.error("For Supabase, use a Postgres connection string that works with pg_dump.")
    process.exit(1)
  }

  const prefix = (process.env.S3_BACKUP_PREFIX || "postgres").replace(/^\/+|\/+$/g, "")
  const outputDir =
    process.env.BACKUP_OUTPUT_DIR || path.join(os.tmpdir(), "judging-platform-db-backups")

  fs.mkdirSync(outputDir, { recursive: true })

  const now = new Date()
  const { year, month, day, timestamp } = getTimestampParts(now)
  const keyBase = `${prefix}/${year}/${month}/${day}/${timestamp}`
  const dumpPath = path.join(outputDir, `${timestamp}.dump`)
  const manifestPath = path.join(outputDir, `${timestamp}.json`)

  const pgDumpArgs = ["--format=custom", "--file", dumpPath, databaseUrl]

  console.log(`Creating database dump at ${dumpPath}`)
  const result = spawnSync("pg_dump", pgDumpArgs, {
    stdio: "inherit",
    env: process.env,
  })

  if (result.error) {
    if (result.error.code === "ENOENT") {
      console.error("pg_dump was not found on PATH. Install PostgreSQL client tools first.")
    } else {
      console.error(`pg_dump failed: ${result.error.message}`)
    }
    process.exit(1)
  }

  if (result.status !== 0) {
    process.exit(result.status || 1)
  }

  const stat = fs.statSync(dumpPath)
  const sha256 = await sha256File(dumpPath)
  const manifest = {
    created_at: now.toISOString(),
    git_sha: process.env.GITHUB_SHA || null,
    dump_filename: path.basename(dumpPath),
    manifest_filename: path.basename(manifestPath),
    dump_size_bytes: stat.size,
    dump_sha256: sha256,
    s3_dump_key: `${keyBase}.dump`,
    s3_manifest_key: `${keyBase}.json`,
  }

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8")

  appendGitHubOutput("dump_path", dumpPath)
  appendGitHubOutput("manifest_path", manifestPath)
  appendGitHubOutput("s3_dump_key", manifest.s3_dump_key)
  appendGitHubOutput("s3_manifest_key", manifest.s3_manifest_key)
  appendGitHubOutput("dump_size_bytes", String(stat.size))
  appendGitHubOutput("dump_sha256", sha256)

  console.log(`Dump size: ${stat.size} bytes`)
  console.log(`SHA256: ${sha256}`)
  console.log(`S3 dump key: ${manifest.s3_dump_key}`)
  console.log(`S3 manifest key: ${manifest.s3_manifest_key}`)
}

main().catch((error) => {
  console.error("Backup failed:", error.message || error)
  process.exit(1)
})
