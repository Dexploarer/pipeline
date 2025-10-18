/**
 * Zod Validation Schemas for API Requests
 * Comprehensive input validation for all endpoints
 */

import { z } from "zod"

// ============================================================================
// SHARED SCHEMAS
// ============================================================================

export const uuidSchema = z.string().uuid("Invalid UUID format")

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["asc", "desc"]).default("desc"),
  sortBy: z.string().optional(),
})

export const searchSchema = z.object({
  query: z.string().min(1).max(500),
  ...paginationSchema.shape,
  filters: z.record(z.any()).optional(),
})

// ============================================================================
// NPC SCHEMAS
// ============================================================================

export const npcArchetypeSchema = z.enum([
  "merchant",
  "warrior",
  "scholar",
  "rogue",
  "mystic",
  "noble",
  "commoner",
])

export const generateNPCSchema = z.object({
  prompt: z.string().min(10).max(2000),
  archetype: npcArchetypeSchema.optional(),
  model: z.string().optional(),
  zoneId: uuidSchema.optional(),
  relatedNpcIds: z.array(uuidSchema).max(10).optional(),
  includeDialogue: z.boolean().default(true),
  includeQuests: z.boolean().default(true),
  includeRelationships: z.boolean().default(false),
  priority: z.enum(["cost", "quality", "speed"]).default("quality"),
})

export const createNPCSchema = z.object({
  name: z.string().min(1).max(255),
  archetype: npcArchetypeSchema,
  personality: z.record(z.any()),
  dialogueStyle: z.string().max(1000).optional(),
  backstory: z.string().max(5000).optional(),
  goals: z.array(z.string()).max(20).optional(),
  zoneId: uuidSchema.optional(),
  spawnPoint: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number().optional(),
    rotation: z.number().optional(),
  }).optional(),
  behavior: z.record(z.any()).optional(),
  elizaosConfig: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
})

export const updateNPCSchema = createNPCSchema.partial()

export const listNPCsSchema = z.object({
  ...paginationSchema.shape,
  zoneId: uuidSchema.optional(),
  archetype: npcArchetypeSchema.optional(),
  search: z.string().max(500).optional(),
})

// ============================================================================
// QUEST SCHEMAS
// ============================================================================

export const questLayerTypeSchema = z.enum([
  "gameflow",
  "lore",
  "history",
  "relationships",
  "economy",
  "world-events",
])

export const generateQuestLayerSchema = z.object({
  questTitle: z.string().min(1).max(255),
  layerType: questLayerTypeSchema,
  existingLayers: z.record(z.any()).optional(),
  zoneId: uuidSchema.optional(),
  relatedNpcIds: z.array(uuidSchema).max(20).optional(),
  model: z.string().optional(),
  customModel: z.string().optional(),
})

export const createQuestSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  objectives: z.array(z.object({
    id: z.string(),
    description: z.string(),
    completed: z.boolean().default(false),
  })),
  rewards: z.record(z.any()).optional(),
  requirements: z.record(z.any()).optional(),
  zoneId: uuidSchema.optional(),
  questGiverNpcId: uuidSchema.optional(),
  gameflowLayer: z.record(z.any()).optional(),
  loreLayer: z.record(z.any()).optional(),
  historyLayer: z.record(z.any()).optional(),
  relationshipsLayer: z.record(z.any()).optional(),
  economyLayer: z.record(z.any()).optional(),
  worldEventsLayer: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
})

export const updateQuestSchema = createQuestSchema.partial()

export const listQuestsSchema = z.object({
  ...paginationSchema.shape,
  zoneId: uuidSchema.optional(),
  questGiverId: uuidSchema.optional(),
  status: z.enum(["active", "completed", "failed", "abandoned"]).optional(),
})

// ============================================================================
// DIALOGUE SCHEMAS
// ============================================================================

export const dialogueNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string(),
    text: z.string().min(1).max(2000),
    speaker: z.enum(["npc", "player"]),
    responses: z.array(dialogueNodeSchema).optional(),
    conditions: z.record(z.any()).optional(),
    actions: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
  })
)

export const generateDialogueSchema = z.object({
  context: z.string().min(10).max(2000),
  existingNodes: z.array(dialogueNodeSchema).optional(),
  model: z.string().optional(),
  npcId: uuidSchema.optional(),
  maxDepth: z.number().int().min(1).max(10).default(3),
  branchingFactor: z.number().int().min(1).max(5).default(3),
})

export const createDialogueTreeSchema = z.object({
  name: z.string().min(1).max(255),
  npcId: uuidSchema.optional(),
  nodes: z.array(dialogueNodeSchema),
  metadata: z.record(z.any()).optional(),
})

export const updateDialogueTreeSchema = createDialogueTreeSchema.partial()

// ============================================================================
// LORE SCHEMAS
// ============================================================================

export const loreCategorySchema = z.enum([
  "history",
  "culture",
  "geography",
  "magic",
  "religion",
  "politics",
  "economy",
  "legend",
  "bestiary",
])

export const generateLoreSchema = z.object({
  prompt: z.string().min(10).max(2000),
  category: loreCategorySchema,
  existingLore: z.array(z.string()).optional(),
  model: z.string().optional(),
  zoneId: uuidSchema.optional(),
  relatedNpcIds: z.array(uuidSchema).optional(),
  relatedQuestIds: z.array(uuidSchema).optional(),
})

export const createLoreSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1).max(10000),
  category: loreCategorySchema,
  tags: z.array(z.string()).max(20).optional(),
  zoneId: uuidSchema.optional(),
  relatedNpcIds: z.array(uuidSchema).optional(),
  relatedQuestIds: z.array(uuidSchema).optional(),
  metadata: z.record(z.any()).optional(),
})

export const updateLoreSchema = createLoreSchema.partial()

export const listLoreSchema = z.object({
  ...paginationSchema.shape,
  category: loreCategorySchema.optional(),
  zoneId: uuidSchema.optional(),
  tags: z.array(z.string()).optional(),
})

// ============================================================================
// ZONE SCHEMAS
// ============================================================================

export const zoneTypeSchema = z.enum([
  "city",
  "wilderness",
  "dungeon",
  "village",
  "landmark",
  "region",
])

export const createZoneSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  type: zoneTypeSchema,
  dangerLevel: z.number().int().min(1).max(10).default(1),
  coordinates: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number().optional(),
  }).optional(),
  parentZoneId: uuidSchema.optional(),
  factions: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
})

export const updateZoneSchema = createZoneSchema.partial()

export const listZonesSchema = z.object({
  ...paginationSchema.shape,
  type: zoneTypeSchema.optional(),
  parentZoneId: uuidSchema.optional(),
  minDangerLevel: z.number().int().min(1).max(10).optional(),
  maxDangerLevel: z.number().int().min(1).max(10).optional(),
})

// ============================================================================
// RELATIONSHIP SCHEMAS
// ============================================================================

export const relationshipTypeSchema = z.enum([
  "ally",
  "enemy",
  "neutral",
  "trading_partner",
  "rival",
  "family",
])

export const createRelationshipSchema = z.object({
  sourceNpcId: uuidSchema,
  targetNpcId: uuidSchema,
  relationshipType: relationshipTypeSchema,
  strength: z.number().int().min(-100).max(100).default(0),
  description: z.string().max(1000).optional(),
  metadata: z.record(z.any()).optional(),
})

export const updateRelationshipSchema = createRelationshipSchema.partial().omit({
  sourceNpcId: true,
  targetNpcId: true,
})

// ============================================================================
// CONTENT PACK SCHEMAS
// ============================================================================

export const contentPackCategorySchema = z.enum([
  "combat",
  "dialogue",
  "quest",
  "economy",
  "social",
  "exploration",
  "crafting",
  "magic",
  "companion",
  "utility",
])

export const createContentPackSchema = z.object({
  name: z.string().min(1).max(255),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "Version must be in semver format (e.g., 1.0.0)"),
  description: z.string().max(5000).optional(),
  author: z.string().max(255).optional(),
  category: contentPackCategorySchema,
  tags: z.array(z.string()).max(20).optional(),
  zoneIds: z.array(uuidSchema).optional(),
  actions: z.array(z.record(z.any())).optional(),
  providers: z.array(z.record(z.any())).optional(),
  evaluators: z.array(z.record(z.any())).optional(),
  systems: z.array(z.record(z.any())).optional(),
  stateManagers: z.array(z.record(z.any())).optional(),
  dependencies: z.array(z.string()).optional(),
  compatibility: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
})

export const updateContentPackSchema = createContentPackSchema.partial()

export const listContentPacksSchema = z.object({
  ...paginationSchema.shape,
  category: contentPackCategorySchema.optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  tags: z.array(z.string()).optional(),
})

// ============================================================================
// SIMULATION SCHEMAS
// ============================================================================

export const simulateInteractionSchema = z.object({
  npcScript: z.record(z.any()),
  playerInput: z.string().min(1).max(1000),
  sessionId: uuidSchema.optional(),
  context: z.record(z.any()).optional(),
})

// ============================================================================
// ASSET SCHEMAS
// ============================================================================

export const assetTypeSchema = z.enum([
  "image",
  "audio",
  "text",
  "model",
  "archive",
])

// Cross-environment file validation schema
// Browser environments: File object from FormData
const browserFileSchema = z.instanceof(File)

// Node.js environments: File-like objects from multer, formidable, or Buffer/Stream
const nodeFileSchema = z.object({
  name: z.string(),
  size: z.number(),
  type: z.string(),
}).passthrough() // Allow additional properties like buffer, stream, path, etc.

export const uploadAssetSchema = z.object({
  file: z.union([browserFileSchema, nodeFileSchema]),
  type: assetTypeSchema,
  npcId: uuidSchema.optional(),
  zoneId: uuidSchema.optional(),
  questId: uuidSchema.optional(),
  contentPackId: uuidSchema.optional(),
  metadata: z.record(z.any()).optional(),
})

export const listAssetsSchema = z.object({
  ...paginationSchema.shape,
  type: assetTypeSchema.optional(),
  npcId: uuidSchema.optional(),
  zoneId: uuidSchema.optional(),
  questId: uuidSchema.optional(),
  contentPackId: uuidSchema.optional(),
})

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

export const batchGenerateNPCsSchema = z.object({
  npcs: z.array(generateNPCSchema).min(1).max(50),
  zoneId: uuidSchema.optional(),
  progressCallback: z.function().optional(),
})

// ============================================================================
// EXPORT SCHEMAS
// ============================================================================

export const exportFormatSchema = z.enum([
  "json",
  "typescript",
  "package",
  "yaml",
  "csv",
])

export const exportContentSchema = z.object({
  format: exportFormatSchema,
  entityType: z.enum(["npc", "quest", "dialogue", "lore", "zone", "content_pack"]),
  entityIds: z.array(uuidSchema).min(1),
  includeRelated: z.boolean().default(false),
  includeAssets: z.boolean().default(false),
})

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateRequest<T>(schema: z.ZodType<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: z.ZodError
} {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error }
    }
    throw error
  }
}

export function formatValidationErrors(errors: z.ZodError): Array<{
  field: string
  message: string
}> {
  return errors.errors.map(err => ({
    field: err.path.join("."),
    message: err.message,
  }))
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type GenerateNPCInput = z.infer<typeof generateNPCSchema>
export type CreateNPCInput = z.infer<typeof createNPCSchema>
export type UpdateNPCInput = z.infer<typeof updateNPCSchema>
export type ListNPCsInput = z.infer<typeof listNPCsSchema>

export type GenerateQuestLayerInput = z.infer<typeof generateQuestLayerSchema>
export type CreateQuestInput = z.infer<typeof createQuestSchema>
export type UpdateQuestInput = z.infer<typeof updateQuestSchema>
export type ListQuestsInput = z.infer<typeof listQuestsSchema>

export type GenerateDialogueInput = z.infer<typeof generateDialogueSchema>
export type CreateDialogueTreeInput = z.infer<typeof createDialogueTreeSchema>
export type UpdateDialogueTreeInput = z.infer<typeof updateDialogueTreeSchema>

export type GenerateLoreInput = z.infer<typeof generateLoreSchema>
export type CreateLoreInput = z.infer<typeof createLoreSchema>
export type UpdateLoreInput = z.infer<typeof updateLoreSchema>
export type ListLoreInput = z.infer<typeof listLoreSchema>

export type CreateZoneInput = z.infer<typeof createZoneSchema>
export type UpdateZoneInput = z.infer<typeof updateZoneSchema>
export type ListZonesInput = z.infer<typeof listZonesSchema>

export type CreateRelationshipInput = z.infer<typeof createRelationshipSchema>
export type UpdateRelationshipInput = z.infer<typeof updateRelationshipSchema>

export type CreateContentPackInput = z.infer<typeof createContentPackSchema>
export type UpdateContentPackInput = z.infer<typeof updateContentPackSchema>
export type ListContentPacksInput = z.infer<typeof listContentPacksSchema>

export type SimulateInteractionInput = z.infer<typeof simulateInteractionSchema>
export type ExportContentInput = z.infer<typeof exportContentSchema>
