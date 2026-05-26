import { NextResponse } from "next/server"
import { isDatabaseAvailable } from "@/lib/db/client"
import { getRedisClient } from "@/lib/cache/client"

export const runtime = "nodejs"

export async function GET() {
  const checks = {
    database: false,
    cache: false,
  }

  try {
    checks.database = isDatabaseAvailable()
  } catch {
    checks.database = false
  }

  try {
    checks.cache = getRedisClient() !== null
  } catch {
    checks.cache = false
  }

  const allHealthy = checks.database && checks.cache
  const status = allHealthy ? "ok" : "degraded"

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      version: process.env["npm_package_version"] || "0.1.0",
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  )
}
