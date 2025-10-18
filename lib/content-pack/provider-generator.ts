/**
 * Provider Generator for ElizaOS Content Packs
 * Generates context injection components for NPCs
 */

import type {
  Provider,
  ProviderDefinition,
  Memory,
  State,
  IAgentRuntime,
} from "@/lib/types/content-pack"

export interface ProviderGeneratorParams {
  name: string
  description: string
  dataSource: ProviderDataSource
  context?: {
    npcId?: string
    zoneId?: string
    worldContext?: string
    customQueries?: string[]
  }
  transformLogic?: string
}

export enum ProviderDataSource {
  LORE = "lore",
  WORLD_STATE = "world_state",
  NPC_MEMORY = "npc_memory",
  PLAYER_STATE = "player_state",
  RELATIONSHIP = "relationship",
  QUEST = "quest",
  INVENTORY = "inventory",
  CUSTOM = "custom",
}

export interface GeneratedProvider {
  definition: ProviderDefinition
  compiled: Provider
  sourceCode: string
}

/**
 * Generate a Provider component from parameters
 */
export async function generateProvider(params: ProviderGeneratorParams): Promise<GeneratedProvider> {
  const {
    name,
    description,
    dataSource,
    context = {},
    transformLogic,
  } = params

  // Generate provider code based on data source
  const getCode = transformLogic ?? await generateProviderCode(name, dataSource, context)

  // Create the definition
  const definition: ProviderDefinition = {
    name,
    description,
    getCode,
  }

  // Compile to executable Provider
  const compiled = compileProvider(definition)

  // Generate source code for export
  const sourceCode = generateProviderSourceCode(definition)

  return {
    definition,
    compiled,
    sourceCode,
  }
}

/**
 * Generate provider code based on data source type
 */
async function generateProviderCode(
  name: string,
  dataSource: ProviderDataSource,
  context: ProviderGeneratorParams["context"]
): Promise<string> {
  switch (dataSource) {
    case ProviderDataSource.LORE:
      return generateLoreProviderCode(name, context)

    case ProviderDataSource.WORLD_STATE:
      return generateWorldStateProviderCode(name, context)

    case ProviderDataSource.NPC_MEMORY:
      return generateNPCMemoryProviderCode(name, context)

    case ProviderDataSource.PLAYER_STATE:
      return generatePlayerStateProviderCode(name, context)

    case ProviderDataSource.RELATIONSHIP:
      return generateRelationshipProviderCode(name, context)

    case ProviderDataSource.QUEST:
      return generateQuestProviderCode(name, context)

    case ProviderDataSource.INVENTORY:
      return generateInventoryProviderCode(name, context)

    case ProviderDataSource.CUSTOM:
    default:
      return generateCustomProviderCode(name, context)
  }
}

/**
 * Generate lore provider code
 */
function generateLoreProviderCode(
  name: string,
  context: ProviderGeneratorParams["context"]
): string {
  return `async (runtime, message, state) => {
  try {
    const loreManager = runtime.loreManager

    // Query lore based on context
    ${context?.worldContext ? `const worldContext = "${context.worldContext}"` : 'const worldContext = state?.bio ?? ""'}

    // Get relevant lore entries
    const loreEntries = await loreManager.getLore({
      context: worldContext,
      count: 5,
    })

    if (!loreEntries || loreEntries.length === 0) {
      return null
    }

    // Format lore for context injection
    const loreText = loreEntries
      .map(entry => \`- \${entry.content}\`)
      .join("\\n")

    return \`Relevant Lore:\\n\${loreText}\`
  } catch (error) {
    console.error("[${name}] Lore provider error:", error)
    return null
  }
}`
}

/**
 * Generate world state provider code
 */
function generateWorldStateProviderCode(
  name: string,
  context: ProviderGeneratorParams["context"]
): string {
  return `async (runtime, message, state) => {
  try {
    const worldSystem = runtime.getService("worldSystem")

    if (!worldSystem) {
      console.warn("[${name}] World system not available")
      return null
    }

    // Query world state
    ${context?.zoneId ? `const zoneId = "${context.zoneId}"` : 'const zoneId = state?.zoneId ?? "default"'}

    const worldState = await worldSystem.queryWorld(\`zone:\${zoneId}\`, runtime)

    if (!worldState) {
      return null
    }

    // Format world state for context
    return \`Current Location: \${worldState.name ?? "Unknown"}\\nDescription: \${worldState.description ?? ""}\\nDanger Level: \${worldState.dangerLevel ?? 0}\`
  } catch (error) {
    console.error("[${name}] World state provider error:", error)
    return null
  }
}`
}

/**
 * Generate NPC memory provider code
 */
function generateNPCMemoryProviderCode(
  name: string,
  context: ProviderGeneratorParams["context"]
): string {
  return `async (runtime, message, state) => {
  try {
    const messageManager = runtime.messageManager

    // Get recent interactions with this user
    const recentMessages = await messageManager.getMemories({
      roomId: message.roomId,
      userId: message.userId,
      count: 10,
    })

    if (!recentMessages || recentMessages.length === 0) {
      return "No previous interactions with this user."
    }

    // Format memory for context
    const memoryText = recentMessages
      .map(msg => \`\${msg.userId === runtime.agentId ? "Me" : "User"}: \${msg.content.text}\`)
      .join("\\n")

    return \`Recent Conversation:\\n\${memoryText}\`
  } catch (error) {
    console.error("[${name}] NPC memory provider error:", error)
    return null
  }
}`
}

/**
 * Generate player state provider code
 */
function generatePlayerStateProviderCode(
  name: string,
  context: ProviderGeneratorParams["context"]
): string {
  return `async (runtime, message, state) => {
  try {
    const stateManager = runtime.getService("playerStateManager")

    if (!stateManager) {
      console.warn("[${name}] Player state manager not available")
      return null
    }

    // Get player state
    const playerState = await stateManager.getState(message.userId)

    if (!playerState) {
      return "New player - no previous state."
    }

    // Format player state for context
    const stateInfo = []
    if (playerState.level) stateInfo.push(\`Level: \${playerState.level}\`)
    if (playerState.faction) stateInfo.push(\`Faction: \${playerState.faction}\`)
    if (playerState.reputation) stateInfo.push(\`Reputation: \${playerState.reputation}\`)

    return stateInfo.length > 0 ? \`Player Info:\\n\${stateInfo.join("\\n")}\` : null
  } catch (error) {
    console.error("[${name}] Player state provider error:", error)
    return null
  }
}`
}

/**
 * Generate relationship provider code
 */
function generateRelationshipProviderCode(
  name: string,
  context: ProviderGeneratorParams["context"]
): string {
  return `async (runtime, message, state) => {
  try {
    const relationshipManager = runtime.getService("relationshipManager")

    if (!relationshipManager) {
      console.warn("[${name}] Relationship manager not available")
      return null
    }

    // Get relationship with player
    const relationship = await relationshipManager.getRelationship(
      runtime.agentId,
      message.userId
    )

    if (!relationship) {
      return "First meeting - no established relationship."
    }

    // Format relationship for context
    return \`Relationship: \${relationship.type} (Level: \${relationship.level})\\nAffinity: \${relationship.affinity}/100\`
  } catch (error) {
    console.error("[${name}] Relationship provider error:", error)
    return null
  }
}`
}

/**
 * Generate quest provider code
 */
function generateQuestProviderCode(
  name: string,
  context: ProviderGeneratorParams["context"]
): string {
  return `async (runtime, message, state) => {
  try {
    const questManager = runtime.getService("questManager")

    if (!questManager) {
      console.warn("[${name}] Quest manager not available")
      return null
    }

    // Get active quests for player
    const activeQuests = await questManager.getActiveQuests(message.userId)

    if (!activeQuests || activeQuests.length === 0) {
      return "No active quests."
    }

    // Format quests for context
    const questText = activeQuests
      .map(quest => \`- \${quest.title} (\${quest.progress}%)\`)
      .join("\\n")

    return \`Active Quests:\\n\${questText}\`
  } catch (error) {
    console.error("[${name}] Quest provider error:", error)
    return null
  }
}`
}

/**
 * Generate inventory provider code
 */
function generateInventoryProviderCode(
  name: string,
  context: ProviderGeneratorParams["context"]
): string {
  return `async (runtime, message, state) => {
  try {
    const inventoryManager = runtime.getService("inventoryManager")

    if (!inventoryManager) {
      console.warn("[${name}] Inventory manager not available")
      return null
    }

    // Get player inventory
    const inventory = await inventoryManager.getInventory(message.userId)

    if (!inventory || inventory.items.length === 0) {
      return "Empty inventory."
    }

    // Format inventory for context
    const itemText = inventory.items
      .slice(0, 10) // Limit to top 10 items
      .map(item => \`- \${item.name} x\${item.quantity}\`)
      .join("\\n")

    return \`Inventory:\\n\${itemText}\${inventory.items.length > 10 ? "\\n...and more" : ""}\`
  } catch (error) {
    console.error("[${name}] Inventory provider error:", error)
    return null
  }
}`
}

/**
 * Generate custom provider code
 */
function generateCustomProviderCode(
  name: string,
  context: ProviderGeneratorParams["context"]
): string {
  return `async (runtime, message, state) => {
  try {
    // Custom provider logic
    ${context?.customQueries?.map(q => `// Query: ${q}`).join("\n    ") ?? '// Add your custom provider logic here'}

    // Example: Access custom service
    // const customService = runtime.getService("myCustomService")
    // const data = await customService.getData(message.userId)

    // Return formatted context string
    return "Custom context data"
  } catch (error) {
    console.error("[${name}] Custom provider error:", error)
    return null
  }
}`
}

/**
 * Compile ProviderDefinition to executable Provider
 */
function compileProvider(definition: ProviderDefinition): Provider {
  // Use Function constructor to compile code string
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const get = new Function(
    "runtime",
    "message",
    "state",
    `return (${definition.getCode})(runtime, message, state)`
  ) as Provider["get"]

  return {
    get,
  }
}

/**
 * Generate TypeScript source code for a Provider
 */
function generateProviderSourceCode(definition: ProviderDefinition): string {
  return `import type { Provider } from "@elizaos/core"

/**
 * ${definition.description}
 */
export const ${toCamelCase(definition.name)}Provider: Provider = {
  get: ${definition.getCode},
}
`
}

/**
 * Generate multiple providers from a template
 */
export async function generateProvidersFromTemplate(
  template: {
    archetype: string
    providers: Array<{
      name: string
      description: string
      dataSource: ProviderDataSource
    }>
  },
  context?: ProviderGeneratorParams["context"]
): Promise<GeneratedProvider[]> {
  const results: GeneratedProvider[] = []

  for (const providerConfig of template.providers) {
    const generated = await generateProvider({
      name: providerConfig.name,
      description: providerConfig.description,
      dataSource: providerConfig.dataSource,
      context,
    })
    results.push(generated)
  }

  return results
}

/**
 * Helper: Convert string to camelCase
 */
function toCamelCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, "")
}

/**
 * Export providers as a module
 */
export function exportProvidersAsModule(
  providers: GeneratedProvider[],
  moduleName: string
): string {
  const providerExports = providers
    .map(p => p.sourceCode)
    .join("\n\n")

  return `/**
 * ${moduleName} Providers
 */

${providerExports}

export const ${toCamelCase(moduleName)}Providers = [
  ${providers.map(p => `${toCamelCase(p.definition.name)}Provider`).join(",\n  ")}
]
`
}
