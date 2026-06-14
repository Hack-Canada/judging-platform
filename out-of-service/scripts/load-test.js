/**
 * Load-test the load-test API (schedule reads or submission writes).
 * Start the app first: npm run dev (or npm run start).
 *
 * Usage:
 *   node scripts/load-test.js schedule [concurrent] [baseUrl]
 *   node scripts/load-test.js submission [concurrent] [baseUrl]
 *
 * Examples:
 *   node scripts/load-test.js schedule 50
 *   node scripts/load-test.js submission 20 http://localhost:3000
 */

const baseUrl = process.argv[4] || process.env.LOAD_TEST_BASE_URL || "http://localhost:3000"
const action = process.argv[2] || "schedule"
const concurrent = Math.min(500, Math.max(1, parseInt(process.argv[3] || "10", 10)))

if (action !== "schedule" && action !== "submission") {
  console.error("Usage: node scripts/load-test.js <schedule|submission> [concurrent] [baseUrl]")
  process.exit(1)
}

const url = `${baseUrl}/api/load-test?action=${action}&n=1`
if (action === "submission") {
  console.log("Submission test will insert then cleanup. Use ?cleanup=0 in URL to keep data (edit script if needed).")
}

function runOne() {
  const u = action === "submission" ? `${url}&cleanup=1` : url
  return fetch(u).then((r) => r.json())
}

async function runBatch(count) {
  const start = Date.now()
  const results = await Promise.all(Array.from({ length: count }, runOne))
  const duration = Date.now() - start
  const ok = results.filter((r) => r.errorCount === 0)
  const err = results.filter((r) => r.errorCount > 0 || r.error)
  return { duration, total: count, success: ok.length, failed: err.length, results }
}

async function main() {
  console.log(`Load test: action=${action}, concurrent=${concurrent}, baseUrl=${baseUrl}`)
  const { duration, total, success, failed, results } = await runBatch(concurrent)
  console.log(`Done in ${duration}ms: ${success}/${total} succeeded, ${failed} failed`)
  if (failed > 0 && results[0]) {
    const firstFail = results.find((r) => r.errorCount > 0 || r.error)
    console.log("Sample error:", firstFail?.error || firstFail?.sampleErrors?.[0])
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
