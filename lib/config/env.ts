/**
 * Environment Variable Validation
 * Validates all required environment variables at startup
 */

import { z } from "zod"

// ============================================================================
// Environment Schema
// ============================================================================

const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Database (required)
  DATABASE_URL: z.string().url().min(1, "DATABASE_URL is required"),
  POSTGRES_URL: z.string().url().optional(),
  DATABASE_URL_UNPOOLED: z.string().url().optional(),

  // AI Providers (at least one required)
  OPENROUTER_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  // Caching (optional but recommended)
  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().optional(),

  // Vector Search (optional)
  UPSTASH_VECTOR_REST_URL: z.string().url().optional(),
  UPSTASH_VECTOR_REST_TOKEN: z.string().optional(),

  // Asset Storage (optional)
  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  // Authentication (optional in development)
  STACK_PROJECT_ID: z.string().optional(),
  STACK_PUBLISHABLE_CLIENT_KEY: z.string().optional(),
  STACK_SECRET_SERVER_KEY: z.string().optional(),

  // Error Monitoring (optional)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Deployment
  VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
  VERCEL_URL: z.string().optional(),
})

// ============================================================================
// Validation Function
// ============================================================================

export function validateEnv(): z.infer<typeof envSchema> {
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error("❌ Environment validation failed:")
    console.error(JSON.stringify(parsed.error.format(), null, 2))
    throw new Error("Invalid environment variables")
  }

  // Check that at least one AI provider is configured
  const hasAIProvider =
    parsed.data.OPENROUTER_API_KEY ||
    parsed.data.OPENAI_API_KEY ||
    parsed.data.ANTHROPIC_API_KEY

  if (!hasAIProvider) {
    console.error("❌ At least one AI provider API key is required:")
    console.error("  - OPENROUTER_API_KEY (recommended for multi-model support)")
    console.error("  - OPENAI_API_KEY (for direct OpenAI access)")
    console.error("  - ANTHROPIC_API_KEY (for direct Claude access)")
    throw new Error("No AI provider API key configured")
  }

  // Warnings for optional but recommended variables
  if (!parsed.data.KV_REST_API_URL || !parsed.data.KV_REST_API_TOKEN) {
    console.warn("⚠️  Redis cache not configured - AI generation results will not be cached")
    console.warn("   Set KV_REST_API_URL and KV_REST_API_TOKEN for better performance")
  }

  if (parsed.data.NODE_ENV === "production") {
    if (!parsed.data.SENTRY_DSN) {
      console.warn("⚠️  Sentry not configured - errors will not be tracked in production")
    }

    if (!parsed.data.STACK_PROJECT_ID || !parsed.data.STACK_SECRET_SERVER_KEY) {
      console.warn("⚠️  Stack Auth not fully configured - authentication may not work")
    }
  }

  console.log("✅ Environment variables validated successfully")

  return parsed.data
}

// ============================================================================
// Validated Environment Export
// ============================================================================

export const env = validateEnv()

// ============================================================================
// Type Exports
// ============================================================================

export type Env = z.infer<typeof envSchema>
