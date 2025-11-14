/**
 * Event-Driven Agent Architecture (ElizaOS-inspired)
 *
 * Architecture Flow:
 * 1. Event occurs (game action, message, etc.)
 * 2. Event logged as XML
 * 3. Providers gather context
 * 4. Logs compiled into prompt via templates
 * 5. Agent processes with LLM
 * 6. Actions executed
 * 7. Evaluators extract insights
 * 8. Memory updated
 */

/**
 * XML Event structure for logging all agent interactions
 */
export interface XMLEvent {
  /** Event type */
  type: 'game_state' | 'action' | 'observation' | 'message' | 'reward' | 'error' | 'thought'
  /** Event timestamp */
  timestamp: Date
  /** Event data as XML string */
  xml: string
  /** Parsed event data */
  data: Record<string, unknown>
  /** Event source */
  source: string
  /** Event metadata */
  metadata?: {
    agentId?: string
    sessionId?: string
    tags?: string[]
    priority?: number
  }
}

/**
 * Event log entry with XML formatting
 */
export interface EventLog {
  /** Log ID */
  id: string
  /** Agent session ID */
  sessionId: string
  /** Event type */
  eventType: string
  /** XML formatted event */
  xmlContent: string
  /** Timestamp */
  timestamp: Date
  /** Log level */
  level: 'debug' | 'info' | 'warning' | 'error'
  /** Associated metadata */
  metadata?: Record<string, unknown>
}

/**
 * Provider interface - supplies context to agents
 * Inspired by ElizaOS providers
 */
export interface Provider {
  /** Provider name */
  name: string
  /** Provider description */
  description: string
  /** Get provider context */
  get(sessionId: string): Promise<ProviderContext>
}

/**
 * Context provided by a provider
 */
export interface ProviderContext {
  /** Provider name */
  providerName: string
  /** Context data as XML */
  xml: string
  /** Priority (higher = more important) */
  priority: number
  /** When this context expires */
  expiresAt?: Date
}

/**
 * Evaluator interface - extracts insights after actions
 * Inspired by ElizaOS evaluators
 */
export interface Evaluator {
  /** Evaluator name */
  name: string
  /** Evaluator description */
  description: string
  /** Evaluate an event sequence */
  evaluate(events: XMLEvent[], sessionId: string): Promise<EvaluationResult>
}

/**
 * Result from an evaluator
 */
export interface EvaluationResult {
  /** Evaluator name */
  evaluatorName: string
  /** Extracted insights as XML */
  insights: string
  /** Facts to store in memory */
  facts: Array<{
    type: string
    content: string
    confidence: number
  }>
  /** Patterns detected */
  patterns?: Array<{
    pattern: string
    occurrences: number
    significance: number
  }>
  /** Recommendations */
  recommendations?: string[]
}

/**
 * Memory entry in the agent's knowledge base
 */
export interface MemoryEntry {
  /** Memory ID */
  id: string
  /** Session ID */
  sessionId: string
  /** Memory type */
  type: 'fact' | 'pattern' | 'relationship' | 'goal' | 'lesson'
  /** Memory content as XML */
  xmlContent: string
  /** When this was learned */
  learnedAt: Date
  /** Confidence level (0-1) */
  confidence: number
  /** How many times this has been reinforced */
  reinforcements: number
  /** Last accessed */
  lastAccessedAt: Date
}

/**
 * Prompt template for compiling logs into prompts
 */
export interface PromptTemplate {
  /** Template name */
  name: string
  /** Template description */
  description: string
  /** Template content with placeholders */
  template: string
  /** Required event types */
  requiredEvents: string[]
  /** Optional provider contexts */
  providers?: string[]
  /** Whether to include memory */
  includeMemory: boolean
}

/**
 * Compiled prompt ready for LLM
 */
export interface CompiledPrompt {
  /** System prompt */
  system: string
  /** User prompt with compiled events */
  user: string
  /** Included events */
  events: XMLEvent[]
  /** Provider contexts included */
  contexts: ProviderContext[]
  /** Memory entries included */
  memories: MemoryEntry[]
  /** Template used */
  templateName: string
}

/**
 * Event message for the agent runtime
 */
export interface EventMessage {
  /** Message ID */
  id: string
  /** Message type */
  type: 'user_input' | 'system' | 'action_result' | 'observation'
  /** Message content as XML */
  xml: string
  /** Parsed content */
  content: Record<string, unknown>
  /** Sender */
  from: string
  /** Recipient */
  to: string
  /** Timestamp */
  timestamp: Date
  /** Message metadata */
  metadata?: Record<string, unknown>
}

/**
 * Agent runtime state
 */
export interface AgentRuntimeState {
  /** Current session ID */
  sessionId: string
  /** Agent ID */
  agentId: string
  /** Event log (recent events) */
  eventLog: XMLEvent[]
  /** Memory store */
  memory: MemoryEntry[]
  /** Active providers */
  providers: Map<string, Provider>
  /** Active evaluators */
  evaluators: Map<string, Evaluator>
  /** Pending events to process */
  eventQueue: EventMessage[]
  /** Runtime status */
  status: 'idle' | 'processing' | 'waiting' | 'error'
  /** Last activity */
  lastActivity: Date
}

/**
 * Event handler function
 */
export type EventHandler = (event: EventMessage, state: AgentRuntimeState) => Promise<void>

/**
 * Event listener registration
 */
export interface EventListener {
  /** Event type to listen for */
  eventType: string
  /** Handler function */
  handler: EventHandler
  /** Priority (higher = runs first) */
  priority: number
}
