import { NextResponse } from "next/server"
import { requireAdminOrSuperadmin } from "@/lib/api-auth"
import fs from "fs"
import path from "path"

export async function GET(request: Request) {
  const authResult = await requireAdminOrSuperadmin(request)
  if (!authResult.ok) return authResult.response

  const csvPath = path.join(process.cwd(), "..", "data", "final_clean_with_general.csv")

  if (!fs.existsSync(csvPath)) {
    return NextResponse.json({ error: "CSV file not found" }, { status: 404 })
  }

  const raw = fs.readFileSync(csvPath, "utf-8")
  const lines = raw.trim().split("\n")
  const headers = lines[0].split(",")
  const tracksIdx = headers.indexOf("tracks")

  if (tracksIdx === -1) {
    return NextResponse.json({ error: "No tracks column found" }, { status: 500 })
  }

  const trackCounts: Record<string, number> = {}
  let totalTeams = 0

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    totalTeams++

    // CSV parsing: handle quoted fields
    const cols = parseCSVLine(line)
    const tracksField = cols[tracksIdx] ?? ""
    const tracks = tracksField.split("|").map((t) => t.trim()).filter(Boolean)

    for (const track of tracks) {
      trackCounts[track] = (trackCounts[track] ?? 0) + 1
    }
  }

  const trackData = Object.entries(trackCounts)
    .map(([track, count]) => ({ track, count }))
    .sort((a, b) => b.count - a.count)

  return NextResponse.json({ totalTeams, trackData })
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === "," && !inQuotes) {
      result.push(current)
      current = ""
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}
