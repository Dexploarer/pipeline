// @ts-ignore - @upstash/vector doesn't have type declarations
import { Index } from "@upstash/vector"

// Validate environment variables at startup
const UPSTASH_SEARCH_REST_URL = process.env["UPSTASH_SEARCH_REST_URL"]
const UPSTASH_SEARCH_REST_TOKEN = process.env["UPSTASH_SEARCH_REST_TOKEN"]

if (!UPSTASH_SEARCH_REST_URL || !UPSTASH_SEARCH_REST_TOKEN) {
  const missing = []
  if (!UPSTASH_SEARCH_REST_URL) missing.push("UPSTASH_SEARCH_REST_URL")
  if (!UPSTASH_SEARCH_REST_TOKEN) missing.push("UPSTASH_SEARCH_REST_TOKEN")
  throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
}

// Initialize vector indexes for different content types
const npcIndex = new Index({
  url: UPSTASH_SEARCH_REST_URL,
  token: UPSTASH_SEARCH_REST_TOKEN,
})

// Index configurations
export const SearchIndexes = {
  NPC: "npcs",
  QUEST: "quests",
  LORE: "lore",
}

// Metadata schemas for filtering
export interface NPCMetadata {
  archetype: string
  zoneId?: string
  dangerLevel?: number
  createdAt: string
}

export interface QuestMetadata {
  questType: string
  difficulty?: string
  zoneId?: string
  status: string
  createdAt: string
}

export interface LoreMetadata {
  category: string
  zoneId?: string
  tags: string[]
  createdAt: string
}

// Export index instance
export { npcIndex }
