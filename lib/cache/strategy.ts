export const CacheTiers = {
  // AI Generation Cache (24 hours) - Avoid regenerating identical content
  AI_NPC: (archetype: string, hash: string) => `ai:npc:${archetype}:${hash}`,
  AI_QUEST: (type: string, difficulty: string, hash: string) => `ai:quest:${type}:${difficulty}:${hash}`,
  AI_DIALOGUE: (npcId: string, context: string) => `ai:dialogue:${npcId}:${context}`,
  AI_LORE: (category: string, hash: string) => `ai:lore:${category}:${hash}`,

  // Entity Cache (1 hour) - Reduce database queries
  ZONE: (id: string) => `zone:${id}`,
  NPC: (id: string) => `npc:${id}`,
  QUEST: (id: string) => `quest:${id}`,
  LORE: (id: string) => `lore:${id}`,
  RELATIONSHIP: (id: string) => `relationship:${id}`,
  DIALOGUE_TREE: (id: string) => `dialogue:${id}`,

  // List Cache (5 minutes) - Cache query results
  ZONE_NPCS: (zoneId: string) => `zone:${zoneId}:npcs`,
  ZONE_QUESTS: (zoneId: string) => `zone:${zoneId}:quests`,
  ZONE_LORE: (zoneId: string) => `zone:${zoneId}:lore`,
  ALL_ZONES: () => `list:zones:all`,
  ALL_NPCS: () => `list:npcs:all`,
  ALL_QUESTS: () => `list:quests:all`,
  ALL_LORE: () => `list:lore:all`,

  // Session Cache (1 hour) - User preferences and active sessions
  USER_SESSION: (userId: string) => `session:${userId}`,
  USER_PREFERENCES: (userId: string) => `prefs:${userId}`,
}

// TTL values in seconds
export const CacheTTL = {
  AI_GENERATION: 86400, // 24 hours
  ENTITY: 3600, // 1 hour
  LIST: 300, // 5 minutes
  SESSION: 3600, // 1 hour
  SHORT: 60, // 1 minute
}

// Generate hash for cache keys
export function generateHash(data: any): string {
  return Buffer.from(JSON.stringify(data)).toString("base64").slice(0, 16)
}
