import { npcIndex } from "./indexes"
import { generateEmbedding } from "./embeddings"
import type { NPC } from "../npc-types"

export interface SearchOptions {
  query: string
  filters?: {
    archetype?: string[]
    zoneId?: string[]
  }
  limit?: number
  minScore?: number
}

export interface SearchResult<T> {
  id: string
  score: number
  data: T
  metadata: Record<string, unknown>
}

// Type guard to validate NPC metadata
function isValidNPC(data: unknown): data is NPC {
  if (!data || typeof data !== "object") return false
  const npc = data as Partial<NPC>
  return (
    typeof npc.id === "string" &&
    typeof npc.name === "string" &&
    typeof npc.archetype === "string" &&
    typeof npc.createdAt === "string" &&
    typeof npc.updatedAt === "string"
  )
}

export interface SearchResponse<T> {
  results: SearchResult<T>[]
  total: number
  took: number
}

// Search NPCs using semantic search
export async function searchNPCs(options: SearchOptions): Promise<SearchResponse<NPC>> {
  const startTime = Date.now()
  const { query, filters, limit = 20, minScore = 0.5 } = options

  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query)

    // Validate and sanitize filter inputs
    const sanitizeFilterValue = (value: string): string => {
      // Remove any characters that could be used for injection
      // Only allow alphanumeric, hyphens, and underscores
      return value.replace(/[^a-zA-Z0-9\-_]/g, "")
    }

    // Build filter string with sanitized inputs
    let filterString = ""
    if (filters?.archetype !== undefined && filters.archetype.length > 0) {
      const sanitizedArchetypes = filters.archetype.map(sanitizeFilterValue).filter(a => a.length > 0)
      if (sanitizedArchetypes.length > 0) {
        filterString = `archetype IN [${sanitizedArchetypes.map((a) => `"${a}"`).join(",")}]`
      }
    }
    if (filters?.zoneId !== undefined && filters.zoneId.length > 0) {
      const sanitizedZoneIds = filters.zoneId.map(sanitizeFilterValue).filter(z => z.length > 0)
      if (sanitizedZoneIds.length > 0) {
        const zoneFilter = `zoneId IN [${sanitizedZoneIds.map((z) => `"${z}"`).join(",")}]`
        filterString = filterString ? `${filterString} AND ${zoneFilter}` : zoneFilter
      }
    }

    // Query vector index
    const response = await npcIndex.query({
      vector: queryEmbedding,
      topK: limit,
      includeMetadata: true,
      filter: filterString || undefined,
    })

    // Filter by minimum score and validate NPC metadata before mapping
    const results: SearchResult<NPC>[] = response
      .filter((r: any) => r.score >= minScore && isValidNPC(r.metadata))
      .map((r: any) => ({
        id: String(r.id),
        score: r.score,
        data: r.metadata as NPC,
        metadata: r.metadata ?? {},
      }))

    const took = Date.now() - startTime

    return {
      results,
      total: results.length,
      took,
    }
  } catch (error) {
    console.error("[v0] Search error:", error)
    return {
      results: [],
      total: 0,
      took: Date.now() - startTime,
    }
  }
}

// Search with text matching (fallback)
export async function searchNPCsByText(query: string, npcs: NPC[]): Promise<NPC[]> {
  const lowerQuery = query.toLowerCase()

  return npcs.filter((npc: any) => {
    const personality = npc.personality as Record<string, unknown>
    const traits = Array.isArray(personality["traits"]) ? (personality["traits"] as string[]) : []

    return (
      npc.name.toLowerCase().includes(lowerQuery) ||
      npc.archetype.toLowerCase().includes(lowerQuery) ||
      npc.backstory?.toLowerCase().includes(lowerQuery) === true ||
      traits.some((trait) => trait.toLowerCase().includes(lowerQuery))
    )
  })
}
