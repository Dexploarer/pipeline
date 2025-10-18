/**
 * ElizaOS Content Pack Type Definitions
 * Architecture for Hyperscape Character Plugin Integration
 */

import type { UUID } from "crypto"

// ============================================================================
// Core ElizaOS Types (from @elizaos/core)
// ============================================================================

export interface Memory {
  userId: UUID
  agentId: UUID
  roomId: UUID
  content: {
    text: string
    action?: string
    source?: string
    url?: string
    inReplyTo?: UUID
    attachments?: Array<{
      id: string
      url: string
      title: string
      source: string
      description: string
      text: string
    }>
  }
  embedding?: number[]
  createdAt?: number
}

export interface State {
  userId?: UUID
  agentId?: UUID
  roomId: UUID
  bio: string
  lore: string
  messageDirections: string
  postDirections: string
  actors: string
  actorsData?: Actor[]
  recentMessages: string
  recentMessagesData: Memory[]
  goals?: string
  goalsData?: Goal[]
  actions?: string
  actionNames?: string
  providers?: string
  responseData?: Content
  [key: string]: unknown
}

export interface Actor {
  name: string
  details: string
  id?: UUID
}

export interface Goal {
  id?: UUID
  roomId: UUID
  userId: UUID
  name: string
  status: GoalStatus
  objectives: Objective[]
}

export enum GoalStatus {
  DONE = "DONE",
  FAILED = "FAILED",
  IN_PROGRESS = "IN_PROGRESS",
}

export interface Objective {
  description: string
  completed: boolean
}

export interface Content {
  text: string
  action?: string
  source?: string
  url?: string
  inReplyTo?: UUID
  attachments?: Array<{
    id: string
    url: string
    title: string
    source: string
    description: string
    text: string
  }>
}

export interface IAgentRuntime {
  agentId: UUID
  serverUrl?: string
  databaseAdapter: unknown
  token: string
  character: Character
  providers: Provider[]
  actions: Action[]
  evaluators: Evaluator[]
  plugins: Plugin[]

  messageManager: unknown
  descriptionManager: unknown
  loreManager: unknown
  documentsManager: unknown
  knowledgeManager: unknown

  registerMemoryManager(manager: unknown): void
  getMemoryManager(name: string): unknown
  getService<T>(service: unknown): T | null
  registerService(service: unknown): void
  getSetting(key: string): string | undefined
  getConversationLength(): number
  processActions(
    message: Memory,
    responses: Memory[],
    state?: State,
    callback?: HandlerCallback
  ): Promise<void>
  evaluate(
    message: Memory,
    state?: State,
    didRespond?: boolean,
    callback?: HandlerCallback
  ): Promise<string[]>
  ensureParticipantExists(userId: UUID, roomId: UUID): Promise<void>
  ensureUserExists(
    userId: UUID,
    userName: string | null,
    name: string | null,
    email?: string | null,
    source?: string | null
  ): Promise<void>
  registerAction(action: Action): void
  ensureConnection(
    userId: UUID,
    roomId: UUID,
    userName?: string,
    userScreenName?: string,
    source?: string
  ): Promise<void>
  ensureParticipantInRoom(userId: UUID, roomId: UUID): Promise<void>
  ensureRoomExists(roomId: UUID): Promise<void>
  composeState(message: Memory, additionalKeys?: Record<string, unknown>): Promise<State>
  updateRecentMessageState(state: State): Promise<State>
}

export interface Character {
  id?: UUID
  name: string
  username?: string
  plugins: string[]
  clients: string[]
  modelProvider: string
  settings?: {
    secrets?: Record<string, string>
    voice?: {
      model?: string
      url?: string
    }
  }
  bio: string | string[]
  lore: string[]
  messageExamples: Array<Array<{
    user: string
    content: {
      text: string
      action?: string
    }
  }>>
  postExamples: string[]
  topics: string[]
  adjectives: string[]
  knowledge?: string[]
  style: {
    all: string[]
    chat: string[]
    post: string[]
  }
}

export interface Plugin {
  name: string
  description: string
  actions?: Action[]
  providers?: Provider[]
  evaluators?: Evaluator[]
  services?: unknown[]
  clients?: unknown[]
}

export type Handler = (
  runtime: IAgentRuntime,
  message: Memory,
  state?: State,
  options?: Record<string, unknown>,
  callback?: HandlerCallback
) => Promise<unknown>

export type HandlerCallback = (
  response: Content,
  files?: unknown[]
) => Promise<Memory[]>

export type Validator = (
  runtime: IAgentRuntime,
  message: Memory,
  state?: State
) => Promise<boolean>

// ============================================================================
// Action Type (Executable Behaviors)
// ============================================================================

export interface Action {
  name: string
  similes: string[]
  description: string
  examples: Array<Array<{
    user: string
    content: {
      text: string
      action?: string
    }
  }>>
  handler: Handler
  validate: Validator
}

// ============================================================================
// Provider Type (Context Injection)
// ============================================================================

export interface Provider {
  get: (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ) => Promise<string | null>
}

// ============================================================================
// Evaluator Type (Post-Conversation Analysis)
// ============================================================================

export interface Evaluator {
  name: string
  similes: string[]
  description: string
  examples: Array<Array<{
    user: string
    content: {
      text: string
      action?: string
    }
  }>>
  handler: Handler
  validate: Validator
  alwaysRun?: boolean
}

// ============================================================================
// Game System Interface (World Bridges)
// ============================================================================

export interface IGameSystem {
  name: string
  description: string

  initialize(runtime: IAgentRuntime): Promise<void>

  executeCommand(
    command: string,
    args: string[],
    runtime: IAgentRuntime
  ): Promise<GameSystemResult>

  queryWorld(
    query: string,
    runtime: IAgentRuntime
  ): Promise<Record<string, unknown>>

  updateWorld(
    updates: Record<string, unknown>,
    runtime: IAgentRuntime
  ): Promise<boolean>

  cleanup(): Promise<void>
}

export interface GameSystemResult {
  success: boolean
  data?: Record<string, unknown>
  error?: string
  message?: string
}

// ============================================================================
// State Manager Interface (Per-Player State)
// ============================================================================

export interface IStateManager<T extends PlayerStateData = PlayerStateData> {
  getState(playerId: string): Promise<T | null>

  setState(playerId: string, state: T): Promise<void>

  updateState(
    playerId: string,
    updates: Partial<T>
  ): Promise<void>

  deleteState(playerId: string): Promise<void>

  getAllStates(): Promise<Map<string, T>>

  clearAllStates(): Promise<void>
}

export interface PlayerStateData {
  playerId: string
  lastUpdated: number
  [key: string]: unknown
}

// ============================================================================
// Content Pack Interface (Main Export)
// ============================================================================

export interface IContentPack {
  name: string
  version: string
  description: string
  author?: string

  actions?: Action[]
  providers?: Provider[]
  evaluators?: Evaluator[]
  systems?: IGameSystem[]
  stateManagers?: Map<string, IStateManager>

  dependencies?: string[]

  initialize?(runtime: IAgentRuntime): Promise<void>

  cleanup?(): Promise<void>
}

// ============================================================================
// Content Pack Metadata
// ============================================================================

export interface ContentPackMetadata {
  id: string
  name: string
  version: string
  description: string
  author: string
  createdAt: string
  updatedAt: string
  tags: string[]
  category: ContentPackCategory
  dependencies: string[]
  compatibility: {
    elizaVersion: string
    hyperscrapeVersion?: string
  }
}

export enum ContentPackCategory {
  COMBAT = "combat",
  DIALOGUE = "dialogue",
  QUEST = "quest",
  ECONOMY = "economy",
  SOCIAL = "social",
  EXPLORATION = "exploration",
  CRAFTING = "crafting",
  MAGIC = "magic",
  COMPANION = "companion",
  UTILITY = "utility",
}

// ============================================================================
// Content Pack Builder Types
// ============================================================================

export interface ActionDefinition {
  name: string
  similes: string[]
  description: string
  examples: Array<Array<{
    user: string
    content: {
      text: string
      action?: string
    }
  }>>
  handlerCode: string
  validateCode: string
}

export interface ProviderDefinition {
  name: string
  description: string
  getCode: string
}

export interface EvaluatorDefinition {
  name: string
  similes: string[]
  description: string
  examples: Array<Array<{
    user: string
    content: {
      text: string
      action?: string
    }
  }>>
  handlerCode: string
  validateCode: string
  alwaysRun?: boolean
}

export interface GameSystemDefinition {
  name: string
  description: string
  initializeCode: string
  executeCommandCode: string
  queryWorldCode: string
  updateWorldCode: string
  cleanupCode: string
}

export interface StateManagerDefinition {
  name: string
  stateInterface: string
  getStateCode: string
  setStateCode: string
  updateStateCode: string
  deleteStateCode: string
  getAllStatesCode: string
  clearAllStatesCode: string
}

export interface ContentPackDefinition {
  metadata: ContentPackMetadata
  actions: ActionDefinition[]
  providers: ProviderDefinition[]
  evaluators: EvaluatorDefinition[]
  systems: GameSystemDefinition[]
  stateManagers: StateManagerDefinition[]
  initializeCode?: string
  cleanupCode?: string
}
