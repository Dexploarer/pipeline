import { Redis } from "@upstash/redis"
import { logger } from "@/lib/logging/logger"

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
    logger.warn("Redis credentials not configured - caching is disabled")
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
      logger.error("Cache get error", error instanceof Error ? error : undefined)
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
      logger.error("Cache set error", error instanceof Error ? error : undefined)
    }
  }

  // Delete key from cache
  async del(key: string): Promise<void> {
    try {
      await this.getClient().del(key)
    } catch (error) {
      logger.error("Cache del error", error instanceof Error ? error : undefined)
    }
  }

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.getClient().exists(key)
      return result === 1
    } catch (error) {
      logger.error("Cache exists error", error instanceof Error ? error : undefined)
      return false
    }
  }

  // Get multiple keys
  async mget<T>(keys: string[]): Promise<Array<T | null>> {
    try {
      const results = await this.getClient().mget(...keys)
      return results as Array<T | null>
    } catch (error) {
      logger.error("Cache mget error", error instanceof Error ? error : undefined)
      return keys.map(() => null)
    }
  }

  // Set multiple keys using pipeline
  async mset(entries: Array<[string, unknown, number?]>): Promise<void> {
    try {
      if (entries.length === 0) return
      const pipeline = this.getClient().pipeline()
      for (const entry of entries) {
        const [key, value, ttl] = entry
        if (ttl !== undefined) {
          pipeline.setex(key, ttl, value)
        } else {
          pipeline.set(key, value)
        }
      }
      await pipeline.exec()
    } catch (error) {
      logger.error("Cache mset error", error instanceof Error ? error : new Error(String(error)))
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
      logger.error("Cache keys error", error instanceof Error ? error : undefined)
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
      logger.error("Cache delPattern error", error instanceof Error ? error : undefined)
      return 0
    }
  }

  // Increment counter
  async incr(key: string): Promise<number> {
    try {
      return await this.getClient().incr(key)
    } catch (error) {
      logger.error("Cache incr error", error instanceof Error ? error : undefined)
      return 0
    }
  }

  // Decrement counter
  async decr(key: string): Promise<number> {
    try {
      return await this.getClient().decr(key)
    } catch (error) {
      logger.error("Cache decr error", error instanceof Error ? error : undefined)
      return 0
    }
  }

  // List operations
  async lpush<T>(key: string, value: T): Promise<number> {
    try {
      return await this.getClient().lpush(key, value)
    } catch (error) {
      logger.error("Cache lpush error", error instanceof Error ? error : undefined)
      return 0
    }
  }

  async rpop<T>(key: string): Promise<T | null> {
    try {
      return await this.getClient().rpop<T>(key)
    } catch (error) {
      logger.error("Cache rpop error", error instanceof Error ? error : undefined)
      return null
    }
  }

  async lrange<T>(key: string, start: number, stop: number): Promise<T[]> {
    try {
      return await this.getClient().lrange<T>(key, start, stop)
    } catch (error) {
      logger.error("Cache lrange error", error instanceof Error ? error : undefined)
      return []
    }
  }

  async ltrim(key: string, start: number, stop: number): Promise<void> {
    try {
      await this.getClient().ltrim(key, start, stop)
    } catch (error) {
      logger.error("Cache ltrim error", error instanceof Error ? error : undefined)
    }
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      if (members.length === 0) return 0
      return await this.getClient().sadd(key, ...(members as [string, ...string[]]))
    } catch (error) {
      logger.error("Cache sadd error", error instanceof Error ? error : undefined)
      return 0
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      return await this.getClient().smembers(key)
    } catch (error) {
      logger.error("Cache smembers error", error instanceof Error ? error : undefined)
      return []
    }
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.getClient().srem(key, ...members)
    } catch (error) {
      logger.error("Cache srem error", error instanceof Error ? error : undefined)
      return 0
    }
  }

  // Set expiration
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.getClient().expire(key, seconds)
      return result === 1
    } catch (error) {
      logger.error("Cache expire error", error instanceof Error ? error : undefined)
      return false
    }
  }

  // Get TTL
  async ttl(key: string): Promise<number> {
    try {
      return await this.getClient().ttl(key)
    } catch (error) {
      logger.error("Cache ttl error", error instanceof Error ? error : undefined)
      return -2
    }
  }

  // Execute Lua script (for atomic operations)
  async eval(script: string, keys: string[], args: (string | number)[]): Promise<unknown> {
    try {
      return await this.getClient().eval(script, keys, args)
    } catch (error) {
      logger.error("Cache eval error", error instanceof Error ? error : undefined)
      throw error
    }
  }
}

// Export singleton instance
export const cache = new CacheClient()
