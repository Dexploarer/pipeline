import { Redis } from "@upstash/redis"

let redisClient: Redis | null = null
let redisResolved = false

/**
 * Get the shared Upstash Redis client.
 *
 * Returns `null` when Redis credentials are not configured so that callers
 * can degrade gracefully instead of crashing the process at import time.
 */
export function getRedisClient(): Redis | null {
  if (redisResolved) {
    return redisClient
  }
  redisResolved = true

  const url = process.env["KV_REST_API_URL"]
  const token = process.env["KV_REST_API_TOKEN"]

  if (!url || !token) {
    console.warn("[cache] Redis credentials not configured - caching is disabled")
    return null
  }

  redisClient = new Redis({ url, token })
  return redisClient
}

// Cache client with automatic serialization and error handling
export class CacheClient {
  private getClient(): Redis {
    const client = getRedisClient()
    if (!client) {
      throw new Error("Redis cache is not configured")
    }
    return client
  }

  // Get value from cache
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.getClient().get<T>(key)
      return value
    } catch (error) {
      console.error("[v0] Cache get error:", error)
      return null
    }
  }

  // Set value in cache with TTL
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      if (ttl !== undefined) {
        await this.getClient().setex(key, ttl, value)
      } else {
        await this.getClient().set(key, value)
      }
    } catch (error) {
      console.error("[v0] Cache set error:", error)
    }
  }

  // Delete key from cache
  async del(key: string): Promise<void> {
    try {
      await this.getClient().del(key)
    } catch (error) {
      console.error("[v0] Cache del error:", error)
    }
  }

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.getClient().exists(key)
      return result === 1
    } catch (error) {
      console.error("[v0] Cache exists error:", error)
      return false
    }
  }

  // Get multiple keys
  async mget<T>(keys: string[]): Promise<Array<T | null>> {
    try {
      const results = await this.getClient().mget(...keys)
      return results as Array<T | null>
    } catch (error) {
      console.error("[v0] Cache mget error:", error)
      return keys.map(() => null)
    }
  }

  // Set multiple keys
  async mset(entries: Array<[string, unknown, number?]>): Promise<void> {
    try {
      for (const entry of entries) {
        const [key, value, ttl] = entry
        await this.set(key, value, ttl)
      }
    } catch (error) {
      console.error("[v0] Cache mset error:", error)
    }
  }

  // Get keys matching pattern using SCAN to avoid blocking
  async keys(pattern: string): Promise<string[]> {
    try {
      const allKeys = new Set<string>()
      let cursor = "0"

      do {
        // Use SCAN with pattern and count
        const result = await this.getClient().scan(cursor, {
          match: pattern,
          count: 100,
        })

        // Result format: [nextCursor, keys]
        cursor = result[0]
        const keys = result[1]

        // Add keys to set (automatically deduplicates)
        for (const key of keys) {
          allKeys.add(key)
        }
      } while (cursor !== "0")

      return Array.from(allKeys)
    } catch (error) {
      console.error("[v0] Cache keys error:", error)
      return []
    }
  }

  // Delete keys matching pattern
  async delPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.keys(pattern)
      if (keys.length > 0) {
        await this.getClient().del(...keys)
        return keys.length
      }
      return 0
    } catch (error) {
      console.error("[v0] Cache delPattern error:", error)
      return 0
    }
  }

  // Increment counter
  async incr(key: string): Promise<number> {
    try {
      return await this.getClient().incr(key)
    } catch (error) {
      console.error("[v0] Cache incr error:", error)
      return 0
    }
  }

  // Decrement counter
  async decr(key: string): Promise<number> {
    try {
      return await this.getClient().decr(key)
    } catch (error) {
      console.error("[v0] Cache decr error:", error)
      return 0
    }
  }

  // List operations
  async lpush<T>(key: string, value: T): Promise<number> {
    try {
      return await this.getClient().lpush(key, value)
    } catch (error) {
      console.error("[v0] Cache lpush error:", error)
      return 0
    }
  }

  async rpop<T>(key: string): Promise<T | null> {
    try {
      return await this.getClient().rpop<T>(key)
    } catch (error) {
      console.error("[v0] Cache rpop error:", error)
      return null
    }
  }

  async lrange<T>(key: string, start: number, stop: number): Promise<T[]> {
    try {
      return await this.getClient().lrange<T>(key, start, stop)
    } catch (error) {
      console.error("[v0] Cache lrange error:", error)
      return []
    }
  }

  async ltrim(key: string, start: number, stop: number): Promise<void> {
    try {
      await this.getClient().ltrim(key, start, stop)
    } catch (error) {
      console.error("[v0] Cache ltrim error:", error)
    }
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      if (members.length === 0) return 0
      return await this.getClient().sadd(key, ...(members as [string, ...string[]]))
    } catch (error) {
      console.error("[v0] Cache sadd error:", error)
      return 0
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      return await this.getClient().smembers(key)
    } catch (error) {
      console.error("[v0] Cache smembers error:", error)
      return []
    }
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.getClient().srem(key, ...members)
    } catch (error) {
      console.error("[v0] Cache srem error:", error)
      return 0
    }
  }

  // Set expiration
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.getClient().expire(key, seconds)
      return result === 1
    } catch (error) {
      console.error("[v0] Cache expire error:", error)
      return false
    }
  }

  // Get TTL
  async ttl(key: string): Promise<number> {
    try {
      return await this.getClient().ttl(key)
    } catch (error) {
      console.error("[v0] Cache ttl error:", error)
      return -2
    }
  }

  // Execute Lua script (for atomic operations)
  async eval(script: string, keys: string[], args: (string | number)[]): Promise<any> {
    try {
      return await this.getClient().eval(script, keys, args)
    } catch (error) {
      console.error("[v0] Cache eval error:", error)
      throw error
    }
  }
}

// Export singleton instance
export const cache = new CacheClient()
