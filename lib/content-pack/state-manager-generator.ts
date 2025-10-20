/**
 * StateManager Generator for ElizaOS Content Packs
 * Generates per-player state management components for NPCs
 */

import type {
  IStateManager,
  PlayerStateData,
  StateManagerDefinition,
} from "@/lib/types/content-pack"

export interface StateManagerGeneratorParams {
  name: string
  stateInterface: string
  storageType: StateStorageType
  context?: {
    defaultState?: Record<string, unknown>
    persistenceKey?: string
    ttl?: number
  }
  customLogic?: {
    getState?: string
    setState?: string
    updateState?: string
    deleteState?: string
    getAllStates?: string
    clearAllStates?: string
  }
}

export enum StateStorageType {
  MEMORY = "memory",
  DATABASE = "database",
  REDIS = "redis",
  LOCAL_STORAGE = "local_storage",
  CUSTOM = "custom",
}

export interface GeneratedStateManager<T extends PlayerStateData = PlayerStateData> {
  definition: StateManagerDefinition
  compiled: IStateManager<T>
  sourceCode: string
}

/**
 * Generate a StateManager component from parameters
 */
export async function generateStateManager<T extends PlayerStateData = PlayerStateData>(
  params: StateManagerGeneratorParams
): Promise<GeneratedStateManager<T>> {
  const {
    name,
    stateInterface,
    storageType,
    context = {},
    customLogic = {},
  } = params

  // Generate code for each method
  const getStateCode = customLogic.getState ?? await generateGetStateCode(name, storageType, context)
  const setStateCode = customLogic.setState ?? await generateSetStateCode(name, storageType, context)
  const updateStateCode = customLogic.updateState ?? await generateUpdateStateCode(name, storageType, context)
  const deleteStateCode = customLogic.deleteState ?? await generateDeleteStateCode(name, storageType, context)
  const getAllStatesCode = customLogic.getAllStates ?? await generateGetAllStatesCode(name, storageType, context)
  const clearAllStatesCode = customLogic.clearAllStates ?? await generateClearAllStatesCode(name, storageType, context)

  // Create the definition
  const definition: StateManagerDefinition = {
    name,
    stateInterface,
    getStateCode,
    setStateCode,
    updateStateCode,
    deleteStateCode,
    getAllStatesCode,
    clearAllStatesCode,
  }

  // Compile to executable StateManager
  const compiled = compileStateManager<T>(definition, storageType, context)

  // Generate source code for export
  const sourceCode = generateStateManagerSourceCode(definition, storageType)

  return {
    definition,
    compiled,
    sourceCode,
  }
}

/**
 * Generate getState code based on storage type
 */
async function generateGetStateCode(
  name: string,
  storageType: StateStorageType,
  context: StateManagerGeneratorParams["context"]
): Promise<string> {
  const persistenceKey = context?.persistenceKey ?? name.toLowerCase()

  switch (storageType) {
    case StateStorageType.MEMORY:
      return `async (playerId) => {
  return this.stateCache.get(playerId) ?? null
}`

    case StateStorageType.DATABASE:
      return `async (playerId) => {
  try {
    const result = await this.db.query(
      "SELECT * FROM player_states WHERE player_id = $1 AND state_type = $2",
      [playerId, "${persistenceKey}"]
    )

    if (!result || result.length === 0) {
      return null
    }

    return result[0].state_data
  } catch (error) {
    console.error("[${name}] Database getState error:", error)
    return null
  }
}`

    case StateStorageType.REDIS:
      return `async (playerId) => {
  try {
    const key = \`${persistenceKey}:\${playerId}\`
    const data = await this.redis.get(key)

    if (!data) {
      return null
    }

    return JSON.parse(data)
  } catch (error) {
    console.error("[${name}] Redis getState error:", error)
    return null
  }
}`

    case StateStorageType.LOCAL_STORAGE:
      return `async (playerId) => {
  try {
    const key = \`${persistenceKey}:\${playerId}\`
    const data = localStorage.getItem(key)

    if (!data) {
      return null
    }

    return JSON.parse(data)
  } catch (error) {
    console.error("[${name}] LocalStorage getState error:", error)
    return null
  }
}`

    case StateStorageType.CUSTOM:
    default:
      return `async (playerId) => {
  // Custom getState logic
  return null
}`
  }
}

/**
 * Generate setState code based on storage type
 */
async function generateSetStateCode(
  name: string,
  storageType: StateStorageType,
  context: StateManagerGeneratorParams["context"]
): Promise<string> {
  const persistenceKey = context?.persistenceKey ?? name.toLowerCase()
  const ttl = context?.ttl ?? 86400 // 24 hours default

  switch (storageType) {
    case StateStorageType.MEMORY:
      return `async (playerId, state) => {
  this.stateCache.set(playerId, state)
}`

    case StateStorageType.DATABASE:
      return `async (playerId, state) => {
  try {
    await this.db.query(
      \`INSERT INTO player_states (player_id, state_type, state_data, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (player_id, state_type)
       DO UPDATE SET state_data = $3, updated_at = NOW()\`,
      [playerId, "${persistenceKey}", JSON.stringify(state)]
    )
  } catch (error) {
    console.error("[${name}] Database setState error:", error)
    throw error
  }
}`

    case StateStorageType.REDIS:
      return `async (playerId, state) => {
  try {
    const key = \`${persistenceKey}:\${playerId}\`
    await this.redis.setex(key, ${ttl}, JSON.stringify(state))
  } catch (error) {
    console.error("[${name}] Redis setState error:", error)
    throw error
  }
}`

    case StateStorageType.LOCAL_STORAGE:
      return `async (playerId, state) => {
  try {
    const key = \`${persistenceKey}:\${playerId}\`
    localStorage.setItem(key, JSON.stringify(state))
  } catch (error) {
    console.error("[${name}] LocalStorage setState error:", error)
    throw error
  }
}`

    case StateStorageType.CUSTOM:
    default:
      return `async (playerId, state) => {
  // Custom setState logic
}`
  }
}

/**
 * Generate updateState code based on storage type
 */
async function generateUpdateStateCode(
  _name: string,
  _storageType: StateStorageType,
  _context: StateManagerGeneratorParams["context"]
): Promise<string> {
  return `async (playerId, updates) => {
  const currentState = await this.getState(playerId)

  if (!currentState) {
    // Create new state with defaults
    const newState = {
      playerId,
      lastUpdated: Date.now(),
      ...updates,
    }
    await this.setState(playerId, newState)
  } else {
    // Merge updates with current state
    const updatedState = {
      ...currentState,
      ...updates,
      lastUpdated: Date.now(),
    }
    await this.setState(playerId, updatedState)
  }
}`
}

/**
 * Generate deleteState code based on storage type
 */
async function generateDeleteStateCode(
  name: string,
  storageType: StateStorageType,
  context: StateManagerGeneratorParams["context"]
): Promise<string> {
  const persistenceKey = context?.persistenceKey ?? name.toLowerCase()

  switch (storageType) {
    case StateStorageType.MEMORY:
      return `async (playerId) => {
  this.stateCache.delete(playerId)
}`

    case StateStorageType.DATABASE:
      return `async (playerId) => {
  try {
    await this.db.query(
      "DELETE FROM player_states WHERE player_id = $1 AND state_type = $2",
      [playerId, "${persistenceKey}"]
    )
  } catch (error) {
    console.error("[${name}] Database deleteState error:", error)
    throw error
  }
}`

    case StateStorageType.REDIS:
      return `async (playerId) => {
  try {
    const key = \`${persistenceKey}:\${playerId}\`
    await this.redis.del(key)
  } catch (error) {
    console.error("[${name}] Redis deleteState error:", error)
    throw error
  }
}`

    case StateStorageType.LOCAL_STORAGE:
      return `async (playerId) => {
  try {
    const key = \`${persistenceKey}:\${playerId}\`
    localStorage.removeItem(key)
  } catch (error) {
    console.error("[${name}] LocalStorage deleteState error:", error)
    throw error
  }
}`

    case StateStorageType.CUSTOM:
    default:
      return `async (playerId) => {
  // Custom deleteState logic
}`
  }
}

/**
 * Generate getAllStates code based on storage type
 */
async function generateGetAllStatesCode(
  name: string,
  storageType: StateStorageType,
  context: StateManagerGeneratorParams["context"]
): Promise<string> {
  const persistenceKey = context?.persistenceKey ?? name.toLowerCase()

  switch (storageType) {
    case StateStorageType.MEMORY:
      return `async () => {
  return new Map(this.stateCache)
}`

    case StateStorageType.DATABASE:
      return `async () => {
  try {
    const results = await this.db.query(
      "SELECT player_id, state_data FROM player_states WHERE state_type = $1",
      ["${persistenceKey}"]
    )

    const stateMap = new Map()
    for (const row of results) {
      stateMap.set(row.player_id, row.state_data)
    }

    return stateMap
  } catch (error) {
    console.error("[${name}] Database getAllStates error:", error)
    return new Map()
  }
}`

    case StateStorageType.REDIS:
      return `async () => {
  try {
    const pattern = \`${persistenceKey}:*\`
    const batchSize = 100
    let cursor = "0"
    const allKeys: string[] = []

    // Use SCAN to avoid blocking Redis
    do {
      const result = await this.redis.scan(cursor, "MATCH", pattern, "COUNT", batchSize)
      cursor = result[0]
      const keys = result[1]

      if (keys && keys.length > 0) {
        allKeys.push(...keys)
      }
    } while (cursor !== "0")

    const stateMap = new Map()

    // Fetch values for collected keys
    // Use pipeline or MGET for better performance if many keys
    if (allKeys.length > 0) {
      if (allKeys.length <= 100) {
        // For small batches, fetch individually
        for (const key of allKeys) {
          const playerId = key.replace("${persistenceKey}:", "")
          const data = await this.redis.get(key)
          if (data) {
            stateMap.set(playerId, JSON.parse(data))
          }
        }
      } else {
        // For larger batches, use MGET for efficiency
        const values = await this.redis.mget(...allKeys)
        for (let i = 0; i < allKeys.length; i++) {
          const key = allKeys[i]
          const data = values[i]
          if (data) {
            const playerId = key.replace("${persistenceKey}:", "")
            stateMap.set(playerId, JSON.parse(data))
          }
        }
      }
    }

    return stateMap
  } catch (error) {
    console.error("[${name}] Redis getAllStates error:", error)
    return new Map()
  }
}`

    case StateStorageType.LOCAL_STORAGE:
      return `async () => {
  try {
    const stateMap = new Map()
    const prefix = "${persistenceKey}:"

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        const playerId = key.replace(prefix, "")
        const data = localStorage.getItem(key)
        if (data) {
          stateMap.set(playerId, JSON.parse(data))
        }
      }
    }

    return stateMap
  } catch (error) {
    console.error("[${name}] LocalStorage getAllStates error:", error)
    return new Map()
  }
}`

    case StateStorageType.CUSTOM:
    default:
      return `async () => {
  // Custom getAllStates logic
  return new Map()
}`
  }
}

/**
 * Generate clearAllStates code based on storage type
 */
async function generateClearAllStatesCode(
  name: string,
  storageType: StateStorageType,
  context: StateManagerGeneratorParams["context"]
): Promise<string> {
  const persistenceKey = context?.persistenceKey ?? name.toLowerCase()

  switch (storageType) {
    case StateStorageType.MEMORY:
      return `async () => {
  this.stateCache.clear()
}`

    case StateStorageType.DATABASE:
      return `async () => {
  try {
    await this.db.query(
      "DELETE FROM player_states WHERE state_type = $1",
      ["${persistenceKey}"]
    )
  } catch (error) {
    console.error("[${name}] Database clearAllStates error:", error)
    throw error
  }
}`

    case StateStorageType.REDIS:
      return `async () => {
  try {
    const pattern = \`${persistenceKey}:*\`
    const batchSize = 100
    let cursor = "0"
    const keysToDelete: string[] = []

    // Use SCAN to avoid blocking Redis
    do {
      const result = await this.redis.scan(cursor, "MATCH", pattern, "COUNT", batchSize)
      cursor = result[0]
      const keys = result[1]

      if (keys && keys.length > 0) {
        keysToDelete.push(...keys)
      }
    } while (cursor !== "0")

    // Delete keys in batches
    if (keysToDelete.length > 0) {
      // Delete in chunks to avoid large argument lists
      const deleteChunkSize = 1000
      for (let i = 0; i < keysToDelete.length; i += deleteChunkSize) {
        const chunk = keysToDelete.slice(i, i + deleteChunkSize)
        await this.redis.del(...chunk)
      }
    }
  } catch (error) {
    console.error("[${name}] Redis clearAllStates error:", error)
    throw error
  }
}`

    case StateStorageType.LOCAL_STORAGE:
      return `async () => {
  try {
    const prefix = "${persistenceKey}:"
    const keysToRemove: string[] = []

    // Take a stable snapshot of localStorage length first
    const storageLength = localStorage.length

    // Collect all matching keys using the snapshot length
    for (let i = 0; i < storageLength; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key)
      }
    }

    // Now remove the collected keys
    for (const key of keysToRemove) {
      localStorage.removeItem(key)
    }
  } catch (error) {
    console.error("[${name}] LocalStorage clearAllStates error:", error)
    throw error
  }
}`

    case StateStorageType.CUSTOM:
    default:
      return `async () => {
  // Custom clearAllStates logic
}`
  }
}

/**
 * Compile StateManagerDefinition to executable IStateManager
 */
function compileStateManager<T extends PlayerStateData>(
  definition: StateManagerDefinition,
  storageType: StateStorageType,
  context: StateManagerGeneratorParams["context"]
): IStateManager<T> {
  // Create storage backend based on type
  createStorage(storageType, context)

  // Create manager class
  class CompiledStateManager implements IStateManager<T> {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    getState = new Function(
      "playerId",
      `return (${definition.getStateCode}).call(this, playerId)`
    ) as IStateManager<T>["getState"]

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    setState = new Function(
      "playerId",
      "state",
      `return (${definition.setStateCode}).call(this, playerId, state)`
    ) as IStateManager<T>["setState"]

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    updateState = new Function(
      "playerId",
      "updates",
      `return (${definition.updateStateCode}).call(this, playerId, updates)`
    ) as IStateManager<T>["updateState"]

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    deleteState = new Function(
      "playerId",
      `return (${definition.deleteStateCode}).call(this, playerId)`
    ) as IStateManager<T>["deleteState"]

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    getAllStates = new Function(
      `return (${definition.getAllStatesCode}).call(this)`
    ) as IStateManager<T>["getAllStates"]

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    clearAllStates = new Function(
      `return (${definition.clearAllStatesCode}).call(this)`
    ) as IStateManager<T>["clearAllStates"]
  }

  return new CompiledStateManager()
}

/**
 * Create storage backend
 */
function createStorage(
  storageType: StateStorageType,
  _context: StateManagerGeneratorParams["context"]
): { db?: unknown; redis?: unknown } {
  // In a real implementation, this would initialize actual storage clients
  // For now, return empty objects as placeholders
  return {
    db: storageType === StateStorageType.DATABASE ? {} : undefined,
    redis: storageType === StateStorageType.REDIS ? {} : undefined,
  }
}

/**
 * Generate TypeScript source code for a StateManager
 */
function generateStateManagerSourceCode(
  definition: StateManagerDefinition,
  storageType: StateStorageType
): string {
  return `import type { IStateManager, PlayerStateData } from "@/lib/types/content-pack"

/**
 * State interface
 */
${definition.stateInterface}

/**
 * ${definition.name} State Manager (${storageType} storage)
 */
export class ${toPascalCase(definition.name)}StateManager implements IStateManager<${extractInterfaceName(definition.stateInterface)}> {
  private stateCache: Map<string, ${extractInterfaceName(definition.stateInterface)}> = new Map()
  ${storageType === StateStorageType.DATABASE ? 'private db: any // Database client' : ''}
  ${storageType === StateStorageType.REDIS ? 'private redis: any // Redis client' : ''}

  getState = ${definition.getStateCode}

  setState = ${definition.setStateCode}

  updateState = ${definition.updateStateCode}

  deleteState = ${definition.deleteStateCode}

  getAllStates = ${definition.getAllStatesCode}

  clearAllStates = ${definition.clearAllStatesCode}
}
`
}

/**
 * Helper: Convert string to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
    .replace(/\s+/g, "")
}

/**
 * Helper: Extract interface name from interface definition
 */
function extractInterfaceName(interfaceCode: string): string {
  const match = interfaceCode.match(/interface\s+(\w+)/)
  return match?.[1] ?? "PlayerState"
}

/**
 * Export state managers as a module
 */
export function exportStateManagersAsModule(
  managers: GeneratedStateManager[],
  moduleName: string
): string {
  const managerExports = managers
    .map(m => m.sourceCode)
    .join("\n\n")

  return `/**
 * ${moduleName} State Managers
 */

${managerExports}

export const ${toPascalCase(moduleName)}StateManagers = {
  ${managers.map(m => `${toCamelCase(m.definition.name)}: new ${toPascalCase(m.definition.name)}StateManager()`).join(",\n  ")}
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
