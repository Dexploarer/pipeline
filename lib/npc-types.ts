export type NPCPersonality = {
  name: string
  archetype: "merchant" | "warrior" | "scholar" | "rogue" | "mystic" | "noble" | "commoner"
  traits: string[]
  goals: string[]
  fears: string[]
  moralAlignment:
    | "lawful-good"
    | "neutral-good"
    | "chaotic-good"
    | "lawful-neutral"
    | "true-neutral"
    | "chaotic-neutral"
    | "lawful-evil"
    | "neutral-evil"
    | "chaotic-evil"
}

export type DialogueNode = {
  id: string
  text: string
  conditions?: string[]
  responses: {
    text: string
    nextNodeId: string
    effects?: string[]
  }[]
}

export type QuestDefinition = {
  id: string
  title: string
  description: string
  questGiver: string
  objectives: {
    type: "fetch" | "kill" | "escort" | "discover" | "craft" | "social"
    description: string
    target?: string
    quantity?: number
  }[]
  rewards: {
    experience: number
    gold: number
    items?: string[]
    reputation?: { faction: string; amount: number }[]
  }
  prerequisites?: string[]
  loreTags: string[]
}

export type NPCBehavior = {
  id: string
  name: string
  schedule: {
    time: string
    location: string
    activity: string
  }[]
  reactions: {
    trigger: string
    response: string
    priority: number
  }[]
  relationships: {
    npcId: string
    type: "ally" | "rival" | "neutral" | "enemy" | "family" | "romantic"
    strength: number
  }[]
}

export type NPCScript = {
  id: string
  version: string
  createdAt: string
  personality: NPCPersonality
  dialogues: DialogueNode[]
  quests: QuestDefinition[]
  behavior: NPCBehavior
  elizaOSConfig: {
    agentId: string
    memoryEnabled: boolean
    autonomyLevel: "low" | "medium" | "high"
    decisionMakingModel: string
  }
  metadata: {
    tags: string[]
    author: string
    testStatus: "draft" | "testing" | "approved" | "deployed"
    testResults?: TestResult[]
  }
}

export type TestResult = {
  timestamp: string
  scenario: string
  passed: boolean
  metrics: {
    responseTime: number
    coherenceScore: number
    playerSatisfaction?: number
  }
  logs: string[]
}

export type SimulationEvent = {
  timestamp: number
  type: "dialogue" | "quest_start" | "quest_complete" | "relationship_change" | "behavior_trigger"
  npcId: string
  playerId?: string
  data: Record<string, unknown>
}

export type QuestLayer = {
  id: string
  name: string
  type: "gameflow" | "lore" | "history" | "relationships" | "economy" | "world-events"
  data: Record<string, unknown>
  dependencies: string[] // IDs of layers this depends on
}

export type LayeredQuest = {
  id: string
  title: string
  version: string
  layers: {
    gameflow: GameFlowLayer
    lore: LoreLayer
    history: HistoryLayer
    relationships: RelationshipLayer
    economy?: EconomyLayer
    worldEvents?: WorldEventLayer
  }
  metadata: {
    author: string
    createdAt: string
    updatedAt: string
    tags: string[]
    status: "draft" | "review" | "approved" | "deployed"
  }
}

export type GameFlowLayer = {
  objectives: QuestObjective[]
  branches: QuestBranch[]
  triggers: QuestTrigger[]
  rewards: QuestRewards
  difficulty: "trivial" | "easy" | "medium" | "hard" | "epic"
  estimatedDuration: number // minutes
}

export type QuestObjective = {
  id: string
  type: "fetch" | "kill" | "escort" | "discover" | "craft" | "social" | "puzzle" | "stealth"
  description: string
  target?: string
  quantity?: number
  location?: string
  conditions?: string[]
  optional: boolean
}

export type QuestBranch = {
  id: string
  condition: string
  outcomes: {
    success: string[]
    failure: string[]
    alternative?: string[]
  }
}

export type QuestTrigger = {
  event: string
  condition: string
  action: string
}

export type QuestRewards = {
  experience: number
  gold: number
  items?: string[]
  reputation?: { faction: string; amount: number }[]
  unlocks?: string[] // Quest IDs or feature IDs
  titles?: string[]
}

export type LoreLayer = {
  summary: string
  relevantHistory: string[]
  factions: {
    name: string
    involvement: string
    stance: "supportive" | "neutral" | "opposed"
  }[]
  artifacts: {
    name: string
    significance: string
    location?: string
  }[]
  prophecies?: string[]
  culturalContext: string
}

export type HistoryLayer = {
  timeline: HistoricalEvent[]
  precedingEvents: string[]
  consequences: string[]
  historicalFigures: {
    name: string
    role: string
    relevance: string
  }[]
}

export type HistoricalEvent = {
  id: string
  date: string // In-game date
  title: string
  description: string
  participants: string[]
  location: string
  impact: "minor" | "moderate" | "major" | "world-changing"
}

export type RelationshipLayer = {
  npcRelationships: {
    npcId: string
    name: string
    relationship: "ally" | "rival" | "neutral" | "enemy" | "family" | "romantic" | "mentor"
    strength: number // -100 to 100
    history: string
    questRole: "giver" | "helper" | "obstacle" | "beneficiary" | "observer"
  }[]
  factionDynamics: {
    faction1: string
    faction2: string
    relationship: string
    tension: number // 0-100
  }[]
  playerRelationships: {
    requiredReputation?: { faction: string; minimum: number }[]
    affectedBy: string[] // Quest IDs that affect this
  }
}

export type EconomyLayer = {
  costs: {
    gold?: number
    items?: { name: string; quantity: number }[]
    services?: string[]
  }
  economicImpact: {
    marketChanges?: { item: string; priceChange: number }[]
    tradeRoutes?: string[]
    economicConsequences: string
  }
}

export type WorldEventLayer = {
  triggeredEvents: {
    eventId: string
    condition: string
    description: string
    worldStateChanges: Record<string, unknown>
  }[]
  environmentalChanges?: {
    location: string
    change: string
    duration?: string
  }[]
  globalEffects?: string[]
}

export type ContextSource = {
  id: string
  type: "lore" | "history" | "npc" | "faction" | "location" | "item" | "event"
  name: string
  data: Record<string, unknown>
  tags: string[]
  relationships: string[] // IDs of related context sources
}

export type ContextInjectionRule = {
  id: string
  name: string
  sourceTypes: ContextSource["type"][]
  targetLayer: QuestLayer["type"]
  injectionStrategy: "merge" | "replace" | "append" | "conditional"
  conditions?: string[]
  priority: number
}

export type WorldZone = {
  id: string
  name: string
  description: string
  type: "city" | "wilderness" | "dungeon" | "village" | "landmark" | "region"
  coordinates: {
    x: number
    y: number
    width: number
    height: number
  }
  parentRegionId?: string
  climate?: "temperate" | "tropical" | "arctic" | "desert" | "volcanic" | "mystical"
  dangerLevel: 1 | 2 | 3 | 4 | 5
  factions: string[]
  resources: string[]
  connectedZones: string[] // IDs of adjacent zones
  metadata: {
    color: string
    icon?: string
    discovered: boolean
    locked: boolean
  }
}

export type WorldRegion = {
  id: string
  name: string
  description: string
  zones: string[] // Zone IDs
  lore: string[]
  historicalSignificance: string
  controllingFaction?: string
  mapImageUrl?: string
}

export type ContentPack = {
  id: string
  name: string
  version: string
  description: string
  regionId?: string
  zoneIds: string[]
  // Legacy fields for backward compatibility
  npcIds?: string[]
  questIds?: string[]
  loreIds?: string[]
  contents: {
    npcs: string[] // NPC IDs
    quests: string[] // Quest IDs
    lore: string[] // Lore entry IDs
    dialogues: string[] // Dialogue tree IDs
    relationships: string[] // Relationship IDs
  }
  dependencies: string[] // Other content pack IDs
  metadata: {
    author: string
    createdAt: string
    tags: string[]
    downloadCount?: number
    rating?: number
  }
}

export type ZoneAssignment = {
  entityId: string
  entityType: "npc" | "quest" | "lore" | "dialogue" | "relationship"
  zoneId: string
  spawnPoints?: { x: number; y: number }[]
  conditions?: string[]
}

// Database Zone type
export type Zone = {
  id: string
  name: string
  description: string
  type: "city" | "wilderness" | "dungeon" | "village" | "landmark" | "region"
  dangerLevel: number
  coordinates?: {
    x: number
    y: number
    width: number
    height: number
  }
  climate?: "temperate" | "tropical" | "arctic" | "desert" | "volcanic" | "mystical"
  parentRegionId?: string
  factions?: string[]
  resources?: string[]
  connectedZones?: string[]
  metadata?: {
    color?: string
    icon?: string
    discovered?: boolean
    locked?: boolean
  }
  createdAt: string
  updatedAt: string
}

// NPC database model with flattened properties
export type NPC = {
  id: string
  name: string
  archetype: "merchant" | "warrior" | "scholar" | "rogue" | "mystic" | "noble" | "commoner"
  personality: Record<string, unknown>
  dialogueStyle?: string
  backstory?: string
  goals?: string[]
  zoneId?: string
  spawnLocations?: { x: number; y: number }[]
  aiModelUsed?: string
  generationMetadata?: Record<string, unknown>
  assetUrls?: Record<string, string>
  createdAt: string
  updatedAt: string
}
