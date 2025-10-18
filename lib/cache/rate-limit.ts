import { cache } from "./client"

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
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

// Sliding window rate limiter
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`
  const now = Date.now()

  try {
    // Execute atomic Lua script for increment and TTL management
    const result = await cache.eval(RATE_LIMIT_SCRIPT, [key], [limit, windowSeconds])
    const [count, ttl] = result as [number, number]

    // Calculate reset time based on TTL
    const resetAt = ttl > 0
      ? new Date(now + ttl * 1000)
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
