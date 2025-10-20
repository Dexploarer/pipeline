/**
 * GameSystem Generator for ElizaOS Content Packs
 * Generates world bridge components for NPCs
 */

import type {
  IGameSystem,
  GameSystemDefinition,
} from "@/lib/types/content-pack"

export interface GameSystemGeneratorParams {
  name: string
  description: string
  systemType: GameSystemType
  context?: {
    worldAPI?: string
    commands?: string[]
    queryTargets?: string[]
    updateTargets?: string[]
  }
  customLogic?: {
    initialize?: string
    executeCommand?: string
    queryWorld?: string
    updateWorld?: string
    cleanup?: string
  }
}

export enum GameSystemType {
  COMBAT = "combat",
  INVENTORY = "inventory",
  QUEST = "quest",
  DIALOGUE = "dialogue",
  ECONOMY = "economy",
  CRAFTING = "crafting",
  RELATIONSHIP = "relationship",
  WORLD_STATE = "world_state",
  PLAYER_STATE = "player_state",
  CUSTOM = "custom",
}

export interface GeneratedGameSystem {
  definition: GameSystemDefinition
  compiled: IGameSystem
  sourceCode: string
}

/**
 * Generate a GameSystem component from parameters
 */
export async function generateGameSystem(params: GameSystemGeneratorParams): Promise<GeneratedGameSystem> {
  // Validate all required fields before processing
  if (!params || typeof params !== "object") {
    throw new Error("generateGameSystem requires a valid params object")
  }

  const {
    name,
    description,
    systemType,
    context = {},
    customLogic = {},
  } = params

  // Validate required fields
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    throw new Error("generateGameSystem requires a non-empty 'name' string")
  }

  if (!description || typeof description !== "string" || description.trim().length === 0) {
    throw new Error("generateGameSystem requires a non-empty 'description' string")
  }

  if (!systemType || typeof systemType !== "string" || systemType.trim().length === 0) {
    throw new Error("generateGameSystem requires a non-empty 'systemType' string")
  }

  // Validate systemType is a known value
  const validSystemTypes = Object.values(GameSystemType)
  if (!validSystemTypes.includes(systemType as GameSystemType)) {
    throw new Error(
      `Invalid systemType: "${systemType}". Must be one of: ${validSystemTypes.join(", ")}`
    )
  }

  // Validate optional objects are actually objects
  if (context !== null && typeof context !== "object") {
    throw new Error("generateGameSystem 'context' must be an object or null")
  }

  if (customLogic !== null && typeof customLogic !== "object") {
    throw new Error("generateGameSystem 'customLogic' must be an object or null")
  }

  // Sanitize inputs to prevent malicious content
  const sanitizedName = sanitizeForCodeGeneration(name.trim())
  const sanitizedDescription = sanitizeForCodeGeneration(description.trim())

  // Generate code for each method
  const initializeCode = customLogic.initialize ?? await generateInitializeCode(sanitizedName, systemType, context)
  const executeCommandCode = customLogic.executeCommand ?? await generateExecuteCommandCode(sanitizedName, systemType, context)
  const queryWorldCode = customLogic.queryWorld ?? await generateQueryWorldCode(sanitizedName, systemType, context)
  const updateWorldCode = customLogic.updateWorld ?? await generateUpdateWorldCode(sanitizedName, systemType, context)
  const cleanupCode = customLogic.cleanup ?? await generateCleanupCode(sanitizedName, systemType, context)

  // Create the definition
  const definition: GameSystemDefinition = {
    name: sanitizedName,
    description: sanitizedDescription,
    initializeCode,
    executeCommandCode,
    queryWorldCode,
    updateWorldCode,
    cleanupCode,
  }

  // Compile to executable GameSystem
  const compiled = compileGameSystem(definition)

  // Generate source code for export
  const sourceCode = generateGameSystemSourceCode(definition)

  return {
    definition,
    compiled,
    sourceCode,
  }
}

/**
 * Generate initialize code based on system type
 */
async function generateInitializeCode(
  name: string,
  systemType: GameSystemType,
  context: GameSystemGeneratorParams["context"]
): Promise<string> {
  // Sanitize inputs to prevent injection
  const safeName = sanitizeForCodeGeneration(name)
  const safeSystemType = sanitizeForCodeGeneration(systemType)
  const safeWorldAPI = context?.worldAPI ? sanitizeForCodeGeneration(context.worldAPI) : null

  return `async (runtime) => {
  try {
    console.log(${JSON.stringify(`[${safeName}] Initializing ${safeSystemType} system...`)})

    ${safeWorldAPI ? `
    // Connect to world API
    const worldAPI = ${JSON.stringify(safeWorldAPI)}
    // Initialize API client
    ` : '// Add initialization logic here'}

    // Register system with runtime
    runtime.registerService({
      name: ${JSON.stringify(safeName)},
      type: ${JSON.stringify(safeSystemType)},
    })

    console.log(${JSON.stringify(`[${safeName}] ${safeSystemType} system initialized successfully`)})
  } catch (error) {
    console.error(${JSON.stringify(`[${safeName}] Initialization error:`)}, error)
    throw error
  }
}`
}

/**
 * Generate executeCommand code based on system type
 */
async function generateExecuteCommandCode(
  name: string,
  systemType: GameSystemType,
  context: GameSystemGeneratorParams["context"]
): Promise<string> {
  switch (systemType) {
    case GameSystemType.COMBAT:
      return generateCombatCommandCode(name, context)

    case GameSystemType.INVENTORY:
      return generateInventoryCommandCode(name, context)

    case GameSystemType.QUEST:
      return generateQuestCommandCode(name, context)

    case GameSystemType.ECONOMY:
      return generateEconomyCommandCode(name, context)

    case GameSystemType.RELATIONSHIP:
      return generateRelationshipCommandCode(name, context)

    default:
      return `async (command, args, runtime) => {
  try {
    console.log(\`[${name}] Executing command: \${command} with args:\`, args)

    switch (command) {
      ${context?.commands?.map(cmd => `
      case "${cmd}":
        // Handle ${cmd} command
        return {
          success: true,
          message: "${cmd} executed successfully",
        }`).join("\n      ") ?? ''}

      default:
        return {
          success: false,
          error: \`Unknown command: \${command}\`,
        }
    }
  } catch (error) {
    console.error(\`[${name}] Command execution error:\`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}`
  }
}

/**
 * Generate combat command code
 */
function generateCombatCommandCode(
  name: string,
  context: GameSystemGeneratorParams["context"]
): string {
  return `async (command, args, runtime) => {
  try {
    const [targetId, abilityId, ...extraArgs] = args

    switch (command) {
      case "attack":
        if (!targetId) {
          return { success: false, error: "No target specified" }
        }

        // Execute attack in world
        ${context?.worldAPI ? `
        const result = await fetch("${context.worldAPI}/combat/attack", {
          method: "POST",
          body: JSON.stringify({ targetId, sourceId: runtime.agentId }),
        })
        const data = await result.json()

        return {
          success: true,
          data: data,
          message: \`Attack dealt \${data.damage} damage to \${targetId}\`,
        }
        ` : `
        // Simulate attack
        const damage = Math.floor(Math.random() * 20) + 10
        return {
          success: true,
          data: { damage, targetId },
          message: \`Attack dealt \${damage} damage to \${targetId}\`,
        }
        `}

      case "defend":
        return {
          success: true,
          message: "Defense stance activated",
          data: { defenseBonus: 5 },
        }

      case "useAbility":
        if (!abilityId) {
          return { success: false, error: "No ability specified" }
        }

        return {
          success: true,
          message: \`Used ability: \${abilityId}\`,
          data: { abilityId, targetId },
        }

      case "flee":
        return {
          success: true,
          message: "Successfully fled from combat",
        }

      default:
        return {
          success: false,
          error: \`Unknown combat command: \${command}\`,
        }
    }
  } catch (error) {
    console.error("[${name}] Combat command error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}`
}

/**
 * Generate inventory command code
 */
function generateInventoryCommandCode(
  name: string,
  _context: GameSystemGeneratorParams["context"]
): string {
  return `async (command, args, runtime) => {
  try {
    const [itemId, quantity, ...extraArgs] = args
    const playerId = extraArgs[0] ?? "current"

    switch (command) {
      case "addItem":
        if (!itemId) {
          return { success: false, error: "No item specified" }
        }

        const qty = quantity ? parseInt(quantity) : 1

        return {
          success: true,
          message: \`Added \${qty}x \${itemId} to inventory\`,
          data: { itemId, quantity: qty },
        }

      case "removeItem":
        if (!itemId) {
          return { success: false, error: "No item specified" }
        }

        return {
          success: true,
          message: \`Removed \${itemId} from inventory\`,
          data: { itemId },
        }

      case "getInventory":
        return {
          success: true,
          data: {
            items: [],
            capacity: 100,
            weight: 0,
          },
        }

      case "useItem":
        if (!itemId) {
          return { success: false, error: "No item specified" }
        }

        return {
          success: true,
          message: \`Used item: \${itemId}\`,
          data: { itemId, effect: "item_used" },
        }

      default:
        return {
          success: false,
          error: \`Unknown inventory command: \${command}\`,
        }
    }
  } catch (error) {
    console.error("[${name}] Inventory command error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}`
}

/**
 * Generate quest command code
 */
function generateQuestCommandCode(
  name: string,
  _context: GameSystemGeneratorParams["context"]
): string {
  return `async (command, args, runtime) => {
  try {
    const [questId, objectiveId, ...extraArgs] = args

    switch (command) {
      case "startQuest":
        if (!questId) {
          return { success: false, error: "No quest specified" }
        }

        return {
          success: true,
          message: \`Started quest: \${questId}\`,
          data: { questId, status: "active" },
        }

      case "completeQuest":
        if (!questId) {
          return { success: false, error: "No quest specified" }
        }

        return {
          success: true,
          message: \`Completed quest: \${questId}\`,
          data: { questId, status: "completed", rewards: [] },
        }

      case "updateObjective":
        if (!questId || !objectiveId) {
          return { success: false, error: "Quest and objective IDs required" }
        }

        return {
          success: true,
          message: \`Updated objective: \${objectiveId} in quest: \${questId}\`,
          data: { questId, objectiveId, completed: true },
        }

      case "getActiveQuests":
        return {
          success: true,
          data: {
            quests: [],
          },
        }

      default:
        return {
          success: false,
          error: \`Unknown quest command: \${command}\`,
        }
    }
  } catch (error) {
    console.error("[${name}] Quest command error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}`
}

/**
 * Generate economy command code
 */
function generateEconomyCommandCode(
  name: string,
  _context: GameSystemGeneratorParams["context"]
): string {
  return `async (command, args, runtime) => {
  try {
    const [amount, currency, ...extraArgs] = args

    switch (command) {
      case "addCurrency":
        if (!amount) {
          return { success: false, error: "Amount required" }
        }

        return {
          success: true,
          message: \`Added \${amount} \${currency ?? "gold"}\`,
          data: { amount: parseInt(amount), currency: currency ?? "gold" },
        }

      case "removeCurrency":
        if (!amount) {
          return { success: false, error: "Amount required" }
        }

        return {
          success: true,
          message: \`Removed \${amount} \${currency ?? "gold"}\`,
          data: { amount: parseInt(amount), currency: currency ?? "gold" },
        }

      case "getBalance":
        return {
          success: true,
          data: {
            gold: 100,
            silver: 50,
            copper: 25,
          },
        }

      case "trade":
        return {
          success: true,
          message: "Trade completed",
          data: { tradeId: "trade_" + Date.now() },
        }

      default:
        return {
          success: false,
          error: \`Unknown economy command: \${command}\`,
        }
    }
  } catch (error) {
    console.error("[${name}] Economy command error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}`
}

/**
 * Generate relationship command code
 */
function generateRelationshipCommandCode(
  name: string,
  _context: GameSystemGeneratorParams["context"]
): string {
  return `async (command, args, runtime) => {
  try {
    const [npcId, affinityChange, ...extraArgs] = args

    switch (command) {
      case "updateAffinity":
        if (!npcId || !affinityChange) {
          return { success: false, error: "NPC ID and affinity change required" }
        }

        return {
          success: true,
          message: \`Updated affinity with \${npcId} by \${affinityChange}\`,
          data: { npcId, affinityChange: parseInt(affinityChange) },
        }

      case "getRelationship":
        if (!npcId) {
          return { success: false, error: "NPC ID required" }
        }

        return {
          success: true,
          data: {
            npcId,
            affinity: 50,
            level: 1,
            type: "neutral",
          },
        }

      case "setRelationshipType":
        if (!npcId) {
          return { success: false, error: "NPC ID required" }
        }

        const type = args[1] ?? "neutral"
        return {
          success: true,
          message: \`Set relationship type with \${npcId} to \${type}\`,
          data: { npcId, type },
        }

      default:
        return {
          success: false,
          error: \`Unknown relationship command: \${command}\`,
        }
    }
  } catch (error) {
    console.error("[${name}] Relationship command error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}`
}

/**
 * Generate queryWorld code
 */
async function generateQueryWorldCode(
  name: string,
  _systemType: GameSystemType,
  context: GameSystemGeneratorParams["context"]
): Promise<string> {
  return `async (query, runtime) => {
  try {
    console.log(\`[${name}] Querying world: \${query}\`)

    ${context?.worldAPI ? `
    // Query world API
    const result = await fetch("${context.worldAPI}/query", {
      method: "POST",
      body: JSON.stringify({ query }),
    })
    return await result.json()
    ` : `
    // Parse query and return mock data
    const [queryType, ...params] = query.split(":")

    switch (queryType) {
      ${context?.queryTargets?.map(target => `
      case "${target}":
        return { type: "${target}", data: {} }`).join("\n      ") ?? ''}

      default:
        return { type: queryType, data: {} }
    }
    `}
  } catch (error) {
    console.error("[${name}] Query error:", error)
    return {}
  }
}`
}

/**
 * Generate updateWorld code
 */
async function generateUpdateWorldCode(
  name: string,
  _systemType: GameSystemType,
  context: GameSystemGeneratorParams["context"]
): Promise<string> {
  return `async (updates, runtime) => {
  try {
    console.log(\`[${name}] Updating world:\`, updates)

    ${context?.worldAPI ? `
    // Update world API
    const result = await fetch("${context.worldAPI}/update", {
      method: "POST",
      body: JSON.stringify(updates),
    })
    return result.ok
    ` : `
    // Process updates
    ${context?.updateTargets?.map(target => `
    if (updates.${target}) {
      // Handle ${target} update
    }`).join("\n    ") ?? '// Add update logic here'}

    return true
    `}
  } catch (error) {
    console.error("[${name}] Update error:", error)
    return false
  }
}`
}

/**
 * Generate cleanup code
 */
async function generateCleanupCode(
  name: string,
  systemType: GameSystemType,
  context: GameSystemGeneratorParams["context"]
): Promise<string> {
  return `async () => {
  try {
    console.log("[${name}] Cleaning up ${systemType} system...")

    // Close connections, clear caches, etc.
    ${context?.worldAPI ? '// Close API connections' : '// Add cleanup logic here'}

    console.log("[${name}] Cleanup complete")
  } catch (error) {
    console.error("[${name}] Cleanup error:", error)
  }
}`
}

/**
 * Compile GameSystemDefinition to executable IGameSystem
 */
function compileGameSystem(definition: GameSystemDefinition): IGameSystem {
  // Use Function constructor to compile code strings
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const initialize = new Function(
    "runtime",
    `return (${definition.initializeCode})(runtime)`
  ) as IGameSystem["initialize"]

  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const executeCommand = new Function(
    "command",
    "args",
    "runtime",
    `return (${definition.executeCommandCode})(command, args, runtime)`
  ) as IGameSystem["executeCommand"]

  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const queryWorld = new Function(
    "query",
    "runtime",
    `return (${definition.queryWorldCode})(query, runtime)`
  ) as IGameSystem["queryWorld"]

  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const updateWorld = new Function(
    "updates",
    "runtime",
    `return (${definition.updateWorldCode})(updates, runtime)`
  ) as IGameSystem["updateWorld"]

  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const cleanup = new Function(
    `return (${definition.cleanupCode})()`
  ) as IGameSystem["cleanup"]

  return {
    name: definition.name,
    description: definition.description,
    initialize,
    executeCommand,
    queryWorld,
    updateWorld,
    cleanup,
  }
}

/**
 * Generate TypeScript source code for a GameSystem
 */
function generateGameSystemSourceCode(definition: GameSystemDefinition): string {
  // Sanitize all inputs before embedding in generated code
  const safeName = sanitizeForCodeGeneration(definition.name)
  const safeDescription = sanitizeForCodeGeneration(definition.description)

  // Ensure the camelCase identifier is a valid JavaScript identifier
  const camelCaseName = toCamelCase(safeName)
  const safeIdentifier = sanitizeIdentifier(camelCaseName)

  // Escape description for JSDoc to prevent breaking out of comment block
  const safeJSDocDescription = safeDescription.replace(/\*\//g, "*\\/")

  return `import type { IGameSystem } from "@/lib/types/content-pack"

/**
 * ${safeJSDocDescription}
 */
export const ${safeIdentifier}System: IGameSystem = {
  name: ${JSON.stringify(safeName)},
  description: ${JSON.stringify(safeDescription)},

  initialize: ${definition.initializeCode},

  executeCommand: ${definition.executeCommandCode},

  queryWorld: ${definition.queryWorldCode},

  updateWorld: ${definition.updateWorldCode},

  cleanup: ${definition.cleanupCode},
}
`
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
 * Sanitize string for safe code generation
 * Validates and cleans user inputs before embedding in generated code
 */
function sanitizeForCodeGeneration(value: string): string {
  if (typeof value !== "string") {
    throw new Error(`Expected string for code generation, got ${typeof value}`)
  }

  // Remove any null bytes or control characters that could cause issues
  const cleaned = value.replace(/[\x00-\x1F\x7F]/g, "")

  // Validate length
  if (cleaned.length === 0) {
    throw new Error("Value for code generation cannot be empty after sanitization")
  }

  if (cleaned.length > 1000) {
    throw new Error(`Value for code generation too long: ${cleaned.length} characters (max 1000)`)
  }

  return cleaned
}

/**
 * Sanitize a string to ensure it's a valid JavaScript identifier
 * Identifiers must start with letter/underscore and contain only [A-Za-z0-9_]
 */
function sanitizeIdentifier(value: string): string {
  // Remove all characters that are not valid in JS identifiers
  let cleaned = value.replace(/[^A-Za-z0-9_]/g, "")

  // Ensure it starts with a letter or underscore (not a number)
  if (cleaned.length > 0 && /^[0-9]/.test(cleaned)) {
    cleaned = "_" + cleaned
  }

  // Validate result
  if (cleaned.length === 0) {
    throw new Error(`Cannot create valid identifier from: "${value}"`)
  }

  // Check against reserved keywords
  const reservedKeywords = new Set([
    "break", "case", "catch", "class", "const", "continue", "debugger", "default",
    "delete", "do", "else", "export", "extends", "finally", "for", "function",
    "if", "import", "in", "instanceof", "new", "return", "super", "switch",
    "this", "throw", "try", "typeof", "var", "void", "while", "with", "yield",
  ])

  if (reservedKeywords.has(cleaned)) {
    cleaned = "_" + cleaned
  }

  return cleaned
}

/**
 * Export game systems as a module
 */
export function exportGameSystemsAsModule(
  systems: GeneratedGameSystem[],
  moduleName: string
): string {
  const systemExports = systems
    .map(s => s.sourceCode)
    .join("\n\n")

  return `/**
 * ${moduleName} Game Systems
 */

${systemExports}

export const ${toCamelCase(moduleName)}Systems = [
  ${systems.map(s => `${toCamelCase(s.definition.name)}System`).join(",\n  ")}
]
`
}
