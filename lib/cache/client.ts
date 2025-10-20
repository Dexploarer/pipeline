import { Redis } from "@upstash/redis"

// Validate environment variables
const KV_REST_API_URL = process.env["KV_REST_API_URL"]
const KV_REST_API_TOKEN = process.env["KV_REST_API_TOKEN"]

if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
  throw new Error(
    "Missing required Redis credentials: KV_REST_API_URL and KV_REST_API_TOKEN must be set in environment variables",
  )
}

// Initialize Redis client
const redis = new Redis({
  url: KV_REST_API_URL,
  token: KV_REST_API_TOKEN,
})

// Cache client with automatic serialization and error handling
export class CacheClient {
  private redis: Redis

  constructor() {
    this.redis = redis
  }

  // Get value from cache
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get<T>(key)
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
        await this.redis.setex(key, ttl, value)
      } else {
        await this.redis.set(key, value)
      }
    } catch (error) {
      console.error("[v0] Cache set error:", error)
    }
  }

  // Delete key from cache
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key)
    } catch (error) {
      console.error("[v0] Cache del error:", error)
    }
  }

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key)
      return result === 1
    } catch (error) {
      console.error("[v0] Cache exists error:", error)
      return false
    }
  }

  // Get multiple keys
  async mget<T>(keys: string[]): Promise<Array<T | null>> {
    try {
      const results = await this.redis.mget(...keys)
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
        const result = await this.redis.scan(cursor, {
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
        await this.redis.del(...keys)
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
      return await this.redis.incr(key)
    } catch (error) {
      console.error("[v0] Cache incr error:", error)
      return 0
    }
  }

  // Decrement counter
  async decr(key: string): Promise<number> {
    try {
      return await this.redis.decr(key)
    } catch (error) {
      console.error("[v0] Cache decr error:", error)
      return 0
    }
  }

  // List operations
  async lpush<T>(key: string, value: T): Promise<number> {
    try {
      return await this.redis.lpush(key, value)
    } catch (error) {
      console.error("[v0] Cache lpush error:", error)
      return 0
    }
  }

  async rpop<T>(key: string): Promise<T | null> {
    try {
      return await this.redis.rpop<T>(key)
    } catch (error) {
      console.error("[v0] Cache rpop error:", error)
      return null
    }
  }

  async lrange<T>(key: string, start: number, stop: number): Promise<T[]> {
    try {
      return await this.redis.lrange<T>(key, start, stop)
    } catch (error) {
      console.error("[v0] Cache lrange error:", error)
      return []
    }
  }

  async ltrim(key: string, start: number, stop: number): Promise<void> {
    try {
      await this.redis.ltrim(key, start, stop)
    } catch (error) {
      console.error("[v0] Cache ltrim error:", error)
    }
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      if (members.length === 0) return 0
      return await this.redis.sadd(key, ...(members as [string, ...string[]]))
    } catch (error) {
      console.error("[v0] Cache sadd error:", error)
      return 0
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      return await this.redis.smembers(key)
    } catch (error) {
      console.error("[v0] Cache smembers error:", error)
      return []
    }
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.redis.srem(key, ...members)
    } catch (error) {
      console.error("[v0] Cache srem error:", error)
      return 0
    }
  }

  // Set expiration
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(key, seconds)
      return result === 1
    } catch (error) {
      console.error("[v0] Cache expire error:", error)
      return false
    }
  }

  // Get TTL
  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key)
    } catch (error) {
      console.error("[v0] Cache ttl error:", error)
      return -2
    }
  }

  // Execute Lua script (for atomic operations)
  async eval(script: string, keys: string[], args: (string | number)[]): Promise<any> {
    try {
      return await this.redis.eval(script, keys, args)
    } catch (error) {
      console.error("[v0] Cache eval error:", error)
      throw error
    }
  }
}

// Export singleton instance
export const cache = new CacheClient()
