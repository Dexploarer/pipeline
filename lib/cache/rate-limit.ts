/**
 * Rate Limiting
 * Redis-based request throttling using atomic Lua scripts
 */

import { getRedisClient } from "./client"
import { logger } from "@/lib/logging/logger"

export interface RateLimitConfig {
  requests: number // Max requests (formerly 'limit')
  window: number // Time window in seconds
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number // Unix timestamp in milliseconds
  limit: number
}

// Lua script for atomic rate limit check
const RATE_LIMIT_SCRIPT = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])

local count = redis.call('INCR', key)
local ttl = redis.call('TTL', key)

-- If this is a new key or key has no TTL, set expiration
if ttl == -1 or ttl == -2 then
  redis.call('EXPIRE', key, window)
  ttl = window
end

return {count, ttl}
`

/**
 * Check rate limit using Redis atomic operations
 * Uses Lua script for thread-safe increment and TTL management
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const redis = getRedisClient()
  const key = `ratelimit:${identifier}`
  const now = Date.now()

  // If Redis is not available, allow the request but log warning
  if (!redis) {
    logger.warn("Rate limiting disabled - Redis not configured", { identifier })
    return {
      allowed: true,
      remaining: config.requests,
      resetAt: now + config.window * 1000,
      limit: config.requests,
    }
  }

  try {
    // Execute atomic Lua script for increment and TTL management
    const result = await redis.eval(
      RATE_LIMIT_SCRIPT,
      [key],
      [config.requests.toString(), config.window.toString()]
    )
    const [count, ttl] = result as [number, number]

    // Calculate reset time based on TTL
    const resetAt = ttl > 0
      ? now + ttl * 1000
      : now + config.window * 1000

    const allowed = count <= config.requests
    const remaining = Math.max(0, config.requests - count)

    if (!allowed) {
      logger.warn("Rate limit exceeded", {
        identifier,
        count,
        limit: config.requests,
        window: config.window,
      })
    }

    return {
      allowed,
      remaining,
      resetAt,
      limit: config.requests,
    }
  } catch (error) {
    logger.error("Rate limit check failed", error as Error, { identifier })

    // Fail open - allow request if rate limit check fails
    // This prevents Redis outages from blocking all traffic
    return {
      allowed: true,
      remaining: config.requests,
      resetAt: now + config.window * 1000,
      limit: config.requests,
    }
  }
}

/**
 * Check rate limit and throw error if exceeded
 */
export async function enforceRateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<void> {
  const result = await checkRateLimit(identifier, config)

  if (!result.allowed) {
    const error = new Error("Rate limit exceeded")
    Object.assign(error, {
      code: "RATE_LIMIT_EXCEEDED",
      remaining: result.remaining,
      resetAt: result.resetAt,
      limit: result.limit,
    })
    throw error
  }
}

/**
 * Reset rate limit for an identifier
 */
export async function resetRateLimit(identifier: string): Promise<void> {
  const redis = getRedisClient()

  if (!redis) {
    return
  }

  try {
    const key = `ratelimit:${identifier}`
    await redis.del(key)
    logger.info("Rate limit reset", { identifier })
  } catch (error) {
    logger.error("Failed to reset rate limit", error as Error, { identifier })
  }
}

/**
 * Predefined rate limit configurations
 */
export const RateLimits = {
  // API endpoints
  API_STRICT: { requests: 10, window: 60 }, // 10 requests per minute
  API_NORMAL: { requests: 30, window: 60 }, // 30 requests per minute
  API_RELAXED: { requests: 100, window: 60 }, // 100 requests per minute

  // AI generation (expensive operations)
  AI_GENERATION: { requests: 100, window: 3600 }, // 100 per hour
  AI_GENERATION_STRICT: { requests: 5, window: 60 }, // 5 per minute
  AI_BATCH: { requests: 2, window: 300 }, // 2 batch operations per 5 minutes

  // Authentication
  AUTH_LOGIN: { requests: 5, window: 300 }, // 5 login attempts per 5 minutes
  AUTH_SIGNUP: { requests: 3, window: 3600 }, // 3 signups per hour

  // Database operations
  DATABASE_WRITE: { requests: 500, window: 3600 }, // 500 writes per hour

  // Search and queries
  SEARCH: { requests: 60, window: 60 }, // 60 searches per minute

  // General API
  API_CALL: { requests: 1000, window: 3600 }, // 1000 calls per hour
} as const
