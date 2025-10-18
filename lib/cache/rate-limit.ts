import { cache } from "./client"

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

// Sliding window rate limiter
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`
  const now = Date.now()

  try {
    // Check TTL to see if key exists and has expiration
    const ttl = await cache.ttl(key)

    // Increment the counter
    const count = await cache.incr(key)

    // If this is a new key (TTL was -2 before incr, now -1) or key has no TTL, set expiration atomically
    if (ttl === -2 || ttl === -1) {
      const setResult = await cache.expire(key, windowSeconds)
      // If expire failed, the key might have been created by another process
      // but we should still have a valid count
      if (!setResult) {
        console.warn(`[v0] Failed to set TTL for rate limit key: ${key}`)
      }
    }

    // Calculate reset time based on actual TTL
    const actualTtl = await cache.ttl(key)
    const resetAt = actualTtl > 0
      ? new Date(now + actualTtl * 1000)
      : new Date(now + windowSeconds * 1000)

    const allowed = count <= limit
    const remaining = Math.max(0, limit - count)

    return {
      allowed,
      remaining,
      resetAt,
    }
  } catch (error) {
    console.error("[v0] Rate limit check error:", error)
    // Fail open - allow request if rate limit check fails
    return {
      allowed: true,
      remaining: limit,
      resetAt: new Date(now + windowSeconds * 1000),
    }
  }
}

// Rate limit presets
export const RateLimits = {
  AI_GENERATION: { limit: 100, window: 3600 }, // 100 per hour
  API_CALL: { limit: 1000, window: 3600 }, // 1000 per hour
  DATABASE_WRITE: { limit: 500, window: 3600 }, // 500 per hour
}
