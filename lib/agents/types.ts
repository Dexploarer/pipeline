/**
 * AI Agent System for Game Playing
 *
 * Architecture:
 * - Agents observe game state
 * - Agents reason about actions using LLM with streaming
 * - Agents execute actions through tools
 * - Agents learn from outcomes
 */

/**
 * Game state that agents can observe
 */
export interface GameState {
  /** Unique game session ID */
  sessionId: string
  /** Current game environment/level */
  environment: string
  /** Player/agent position in game world */
  position?: {
    x: number
    y: number
    z?: number
  }
  /** Visible objects/entities in the game */
  visibleEntities: Array<{
    id: string
    type: string
    position: { x: number; y: number; z?: number }
    properties: Record<string, unknown>
  }>
  /** Current inventory items */
  inventory: Array<{
    id: string
    name: string
    quantity: number
    properties?: Record<string, unknown>
  }>
  /** Player/agent stats */
  stats: {
    health?: number
    mana?: number
    stamina?: number
    level?: number
    experience?: number
    gold?: number
    [key: string]: number | undefined
  }
  /** Active quests/objectives */
  activeQuests: Array<{
    id: string
    title: string
    description: string
    objectives: Array<{
      description: string
      completed: boolean
      progress?: number
      target?: number
    }>
  }>
  /** Available actions based on current context */
  availableActions: string[]
  /** Recent game events */
  recentEvents: Array<{
    timestamp: Date
    type: string
    description: string
    data?: Record<string, unknown>
  }>
  /** Current dialogue context (if in conversation) */
  dialogueContext?: {
    npcName: string
    npcId: string
    conversationHistory: Array<{
      speaker: 'agent' | 'npc'
      message: string
    }>
    availableResponses?: string[]
  }
  /** Raw state data from game engine */
  rawState?: Record<string, unknown>
}

/**
 * Action that an agent can execute in the game
 */
export interface GameAction {
  /** Unique action type identifier */
  type: string
  /** Action parameters */
  parameters: Record<string, unknown>
  /** Expected outcome description */
  expectedOutcome?: string
  /** Priority (higher = more important) */
  priority?: number
}

/**
 * Result of executing a game action
 */
export interface ActionResult {
  success: boolean
  action: GameAction
  /** New game state after action */
  newState: GameState
  /** Rewards/penalties from action */
  reward?: number
  /** Description of what happened */
  description: string
  /** Any error that occurred */
  error?: string
}

/**
 * Agent personality and behavior configuration
 */
export interface AgentPersonality {
  /** Agent name */
  name: string
  /** Core personality traits */
  traits: string[]
  /** Play style (aggressive, cautious, exploratory, efficient, etc.) */
  playStyle: 'aggressive' | 'cautious' | 'exploratory' | 'efficient' | 'social' | 'completionist'
  /** Goal priorities */
  goals: {
    primaryGoal: string
    secondaryGoals: string[]
  }
  /** Decision-making preferences */
  preferences: {
    riskTolerance: number // 0-1, higher = more risky
    explorationVsExploitation: number // 0-1, higher = more exploration
    socialInteraction: number // 0-1, higher = more social
    completionismLevel: number // 0-1, higher = tries to complete everything
  }
  /** System prompt for LLM */
  systemPrompt: string
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  /** Unique agent ID */
  id: string
  /** Agent personality */
  personality: AgentPersonality
  /** LLM model to use */
  model: string
  /** Temperature for generation */
  temperature: number
  /** Max tokens per response */
  maxTokens?: number
  /** Whether to stream responses */
  streaming: boolean
  /** Tool execution timeout (ms) */
  toolTimeout?: number
  /** Max consecutive actions before requiring user input */
  maxAutonomousActions?: number
}

/**
 * Agent session state
 */
export interface AgentSession {
  /** Session ID */
  id: string
  /** Agent configuration */
  agent: AgentConfig
  /** Current game state */
  gameState: GameState
  /** Action history */
  actionHistory: Array<{
    action: GameAction
    result: ActionResult
    timestamp: Date
  }>
  /** Decision reasoning history */
  reasoningHistory: Array<{
    thought: string
    action: GameAction
    timestamp: Date
  }>
  /** Cumulative reward */
  totalReward: number
  /** Session start time */
  startedAt: Date
  /** Last activity time */
  lastActivityAt: Date
  /** Session status */
  status: 'active' | 'paused' | 'completed' | 'failed'
  /** Session metadata */
  metadata?: Record<string, unknown>
}

/**
 * Tool definition for agent actions
 */
export interface AgentTool {
  /** Tool name */
  name: string
  /** Tool description for LLM */
  description: string
  /** Input schema (Zod schema) */
  parameters: Record<string, unknown>
  /** Tool execution function */
  execute: (parameters: Record<string, unknown>, gameState: GameState) => Promise<ActionResult>
}

/**
 * Agent observation from the game
 */
export interface AgentObservation {
  /** Current game state */
  state: GameState
  /** Recent feedback/events */
  feedback: string[]
  /** Timestamp of observation */
  timestamp: Date
}

/**
 * Agent decision output
 */
export interface AgentDecision {
  /** Reasoning/thought process */
  reasoning: string
  /** Chosen action */
  action: GameAction
  /** Confidence level (0-1) */
  confidence: number
  /** Alternative actions considered */
  alternatives?: GameAction[]
}

/**
 * Streaming agent response chunk
 */
export interface AgentStreamChunk {
  type: 'thought' | 'action' | 'tool_call' | 'tool_result' | 'complete' | 'error'
  content: string
  data?: unknown
  timestamp: Date
}
