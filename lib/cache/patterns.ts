import { cache } from "./client"
import { CacheTTL } from "./strategy"

// Cache-aside pattern: Check cache first, fetch if miss, store result
export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number
    skipCache?: boolean
    refreshCache?: boolean
  } = {},
): Promise<T> {
  const { ttl = CacheTTL.ENTITY, skipCache = false, refreshCache = false } = options

  // Skip cache if requested
  if (skipCache) {
    const fresh = await fetcher()
    return fresh
  }

  // Check cache first (unless refreshing)
  if (!refreshCache) {
    const cached = await cache.get<T>(key)
    if (cached !== null) {
      return cached
    }
  }

  // Cache miss or refresh - fetch fresh data
  const fresh = await fetcher()

  // Store in cache only if the value is not null or undefined
  if (fresh !== null && fresh !== undefined) {
    await cache.set(key, fresh, ttl)
  }

  return fresh
}

// Invalidate entity cache and related list caches
export async function invalidateEntity(entityType: string, entityId: string): Promise<void> {
  try {
    // Delete entity cache
    await cache.del(`${entityType}:${entityId}`)

    // Delete related list caches
    await cache.delPattern(`list:${entityType}:*`)
    await cache.delPattern(`zone:*:${entityType}s`)

    console.log(`[v0] Invalidated cache for ${entityType}:${entityId}`)
  } catch (error) {
    console.error(`[v0] Cache invalidation error for ${entityType}:${entityId}:`, error)
    throw error
  }
}

// Invalidate all caches for a zone
export async function invalidateZone(zoneId: string): Promise<void> {
  try {
    await cache.del(`zone:${zoneId}`)
    await cache.delPattern(`zone:${zoneId}:*`)
    console.log(`[v0] Invalidated cache for zone:${zoneId}`)
  } catch (error) {
    console.error(`[v0] Cache invalidation error for zone:${zoneId}:`, error)
    throw error
  }
}

// Warm cache with frequently accessed data
export async function warmCache(entityType: string, entities: any[]): Promise<void> {
  // Validate entities have defined IDs before building cache entries
  const validEntities = entities.filter((entity) => {
    if (!entity || entity.id === undefined || entity.id === null) {
      return false
    }
    return true
  })

  const skippedCount = entities.length - validEntities.length
  if (skippedCount > 0) {
    console.warn(`[v0] Skipped ${skippedCount} ${entityType} entities with missing IDs during cache warming`)
  }

  const entries: [string, any, number][] = validEntities.map((entity) => [
    `${entityType}:${entity.id}`,
    entity,
    CacheTTL.ENTITY,
  ])

  await cache.mset(entries)
  console.log(`[v0] Warmed cache with ${validEntities.length} ${entityType} entities`)
}

// Cache AI generation results
export async function cacheAIGeneration(key: string, result: any): Promise<void> {
  await cache.set(key, result, CacheTTL.AI_GENERATION)
}

// Get cached AI generation
export async function getCachedAIGeneration<T>(key: string): Promise<T | null> {
  return await cache.get<T>(key)
}
