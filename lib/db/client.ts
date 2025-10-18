import { neon } from "@neondatabase/serverless"

// Ensure we're on the server side
if (typeof window !== "undefined") {
  throw new Error("Database client can only be used on the server side")
}

// Get database URL with fallback and validation
const getDatabaseUrl = (): string => {
  const url =
    process.env["DATABASE_URL"] ||
    process.env["POSTGRES_URL"] ||
    process.env["DATABASE_URL_UNPOOLED"] ||
    process.env["POSTGRES_URL_NON_POOLING"]

  if (!url) {
    console.error(
      "[v0] Available env vars:",
      Object.keys(process.env).filter((k) => k.includes("DATABASE") || k.includes("POSTGRES")),
    )
    throw new Error(
      "No database connection string found. Please ensure DATABASE_URL or POSTGRES_URL is set in environment variables.",
    )
  }

  return url
}

// Initialize SQL client with error handling
let sql: ReturnType<typeof neon> | null = null
let isInitialized = false

try {
  const dbUrl = getDatabaseUrl()
  sql = neon(dbUrl)
  isInitialized = true
  console.log("[v0] Database client initialized successfully")
} catch (error) {
  console.error("[v0] Failed to initialize database client:", error)
  // Create a mock client that throws helpful errors
  sql = ((() => {
    throw new Error("Database not configured. Please set DATABASE_URL in environment variables.")
  }) as unknown) as ReturnType<typeof neon>
}

export { sql }

// Helper to check if database is available
export function isDatabaseAvailable(): boolean {
  try {
    getDatabaseUrl()
    return true
  } catch {
    return false
  }
}

export async function query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]> {
  if (!isInitialized) {
    throw new Error("Database client not initialized")
  }

  try {
    const result = await sql(text, params as unknown[])
    return result as T[]
  } catch (error) {
    console.error("[v0] Database query error:", error)
    throw error
  }
}
