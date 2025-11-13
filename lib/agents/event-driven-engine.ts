import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import type {
  AgentConfig,
  GameState,
  AgentStreamChunk,
} from './types'
import type {
  XMLEvent,
  EventMessage,
  AgentRuntimeState,
  EventListener,
  MemoryEntry,
} from './event-types'
import { XMLEventLogger } from './event-logger'
import { ProviderRegistry, createDefaultProviders } from './providers'
import { EvaluatorRegistry, createDefaultEvaluators } from './evaluators'
import { PromptCompiler, createDefaultTemplates, selectTemplate } from './prompt-templates'
import { gameActionTools } from './tools'
import type { GameStateProvider, GoalProvider, MemoryProvider, PerformanceProvider, RecentEventsProvider } from './providers'

/**
 * Event-Driven Agent Engine (ElizaOS-inspired)
 *
 * Flow:
 * 1. Event occurs (game state change, message, etc.)
 * 2. Event logged as XML
 * 3. Providers gather context
 * 4. Prompt compiled from template + logs + context
 * 5. LLM processes with streaming
 * 6. Actions executed via tools
 * 7. Evaluators extract insights
 * 8. Memory updated
 */
export class EventDrivenAgentEngine {
  private config: AgentConfig
  private eventLogger: XMLEventLogger
  private providers: ProviderRegistry
  private evaluators: EvaluatorRegistry
  private promptCompiler: PromptCompiler
  private templates: ReturnType<typeof createDefaultTemplates>
  private state: AgentRuntimeState | null = null
  private eventListeners: Map<string, EventListener[]> = new Map()
  private memories: Map<string, MemoryEntry[]> = new Map()

  constructor(config: AgentConfig) {
    this.config = config
    this.eventLogger = new XMLEventLogger()
    this.providers = createDefaultProviders()
    this.evaluators = createDefaultEvaluators()
    this.promptCompiler = new PromptCompiler()
    this.templates = createDefaultTemplates()
  }

  /**
   * Initialize agent runtime session
   */
  async initializeSession(initialGameState: GameState): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

    // Initialize runtime state
    this.state = {
      sessionId,
      agentId: this.config.id,
      eventLog: [],
      memory: [],
      providers: new Map(),
      evaluators: new Map(),
      eventQueue: [],
      status: 'idle',
      lastActivity: new Date(),
    }

    // Initialize providers with session
    const gameStateProvider = this.providers.get('gameState') as GameStateProvider
    if (gameStateProvider) {
      gameStateProvider.setGameState(sessionId, initialGameState)
    }

    const goalProvider = this.providers.get('goals') as GoalProvider
    if (goalProvider) {
      goalProvider.setGoals(
        sessionId,
        this.config.personality.goals.primaryGoal,
        this.config.personality.goals.secondaryGoals
      )
    }

    // Log initial game state
    const stateEvent = this.eventLogger.logGameState(sessionId, initialGameState as any)
    this.state.eventLog.push(stateEvent)

    // Log initialization
    const observationEvent = this.eventLogger.logObservation(
      sessionId,
      `Agent ${this.config.personality.name} initialized in ${initialGameState.environment}`,
      { personality: this.config.personality.playStyle }
    )
    this.state.eventLog.push(observationEvent)

    return sessionId
  }

  /**
   * Process a game state update (event-driven)
   */
  async processGameStateEvent(gameState: GameState): Promise<void> {
    if (!this.state) {
      throw new Error('Session not initialized')
    }

    // Update provider
    const gameStateProvider = this.providers.get('gameState') as GameStateProvider
    if (gameStateProvider) {
      gameStateProvider.setGameState(this.state.sessionId, gameState)
    }

    // Log the event
    const event = this.eventLogger.logGameState(this.state.sessionId, gameState as any)
    this.state.eventLog.push(event)

    // Keep event log manageable
    if (this.state.eventLog.length > 100) {
      this.state.eventLog = this.state.eventLog.slice(-50)
    }

    // Emit event
    await this.emitEvent({
      id: `evt_${Date.now()}`,
      type: 'system',
      xml: event.xml,
      content: { gameState },
      from: 'game_engine',
      to: this.config.id,
      timestamp: new Date(),
    })
  }

  /**
   * Make a decision using event-driven architecture with streaming
   */
  async *decideWithStreaming(): AsyncGenerator<AgentStreamChunk> {
    if (!this.state) {
      throw new Error('Session not initialized')
    }

    this.state.status = 'processing'

    try {
      // 1. Gather provider contexts
      yield {
        type: 'thought',
        content: '📋 Gathering context from providers...',
        timestamp: new Date(),
      }

      const contexts = await this.providers.getAllContexts(this.state.sessionId)

      // 2. Select appropriate template
      const currentGameState = await this.providers.get('gameState')?.get(this.state.sessionId)
      const templateName = selectTemplate(
        currentGameState,
        this.state.eventLog.slice(-10)
      )

      yield {
        type: 'thought',
        content: `📝 Using template: ${templateName}`,
        timestamp: new Date(),
      }

      const template = this.templates.get(templateName)
      if (!template) {
        throw new Error(`Template ${templateName} not found`)
      }

      // 3. Get relevant memories
      const sessionMemories = this.memories.get(this.state.sessionId) || []
      const relevantMemories = sessionMemories
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10)

      // 4. Compile prompt from template
      yield {
        type: 'thought',
        content: '🔨 Compiling prompt from XML logs and context...',
        timestamp: new Date(),
      }

      const compiledPrompt = this.promptCompiler.compile(
        template,
        this.state.eventLog.slice(-20), // Last 20 events
        contexts,
        relevantMemories
      )

      yield {
        type: 'thought',
        content: `✅ Compiled prompt with ${compiledPrompt.events.length} events, ${compiledPrompt.contexts.length} contexts, ${compiledPrompt.memories.length} memories`,
        timestamp: new Date(),
      }

      // 5. Convert tools to AI SDK format
      const tools = gameActionTools.reduce((acc, tool) => {
        acc[tool.name] = {
          description: tool.description,
          parameters: tool.parameters,
        }
        return acc
      }, {} as Record<string, { description: string; parameters: unknown }>)

      // 6. Stream LLM decision
      yield {
        type: 'thought',
        content: '🤔 Agent reasoning...',
        timestamp: new Date(),
      }

      const model = anthropic(this.config.model)

      const result = streamText({
        model,
        system: compiledPrompt.system,
        prompt: compiledPrompt.user,
        tools,
        maxSteps: 3,
        temperature: this.config.temperature,
      })

      // Stream thoughts
      for await (const chunk of result.textStream) {
        yield {
          type: 'thought',
          content: chunk,
          timestamp: new Date(),
        }

        // Log thought
        this.eventLogger.logThought(this.state.sessionId, chunk)
      }

      // 7. Execute tool calls
      const finalResult = await result

      if (finalResult.toolCalls && finalResult.toolCalls.length > 0) {
        for (const toolCall of finalResult.toolCalls) {
          yield {
            type: 'tool_call',
            content: `🔧 Executing: ${toolCall.toolName}`,
            data: toolCall,
            timestamp: new Date(),
          }

          // Find and execute tool
          const tool = gameActionTools.find((t) => t.name === toolCall.toolName)
          if (tool) {
            try {
              // Get current game state for tool execution
              const gameStateProvider = this.providers.get('gameState') as GameStateProvider
              const gameStateContext = await gameStateProvider.get(this.state.sessionId)
              const gameStateData = this.eventLogger.parseXML(gameStateContext.xml)
              const gameState = this.reconstructGameState(gameStateData)

              const actionResult = await tool.execute(toolCall.args, gameState)

              // Log action
              const actionEvent = this.eventLogger.logAction(
                this.state.sessionId,
                toolCall.toolName,
                toolCall.args,
                {
                  success: actionResult.success,
                  description: actionResult.description,
                  reward: actionResult.reward,
                }
              )
              this.state.eventLog.push(actionEvent)

              // Log reward
              if (actionResult.reward !== undefined) {
                const rewardEvent = this.eventLogger.logReward(
                  this.state.sessionId,
                  actionResult.reward,
                  actionResult.description
                )
                this.state.eventLog.push(rewardEvent)
              }

              // Update providers
              if (actionResult.success && actionResult.newState) {
                await this.processGameStateEvent(actionResult.newState)
              }

              const recentEventsProvider = this.providers.get('recentEvents') as RecentEventsProvider
              if (recentEventsProvider) {
                recentEventsProvider.addEvent(
                  this.state.sessionId,
                  toolCall.toolName,
                  actionResult.description
                )
              }

              yield {
                type: 'tool_result',
                content: actionResult.description,
                data: actionResult,
                timestamp: new Date(),
              }
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : 'Unknown error'

              this.eventLogger.logError(this.state.sessionId, errorMsg, {
                tool: toolCall.toolName,
                args: toolCall.args,
              })

              yield {
                type: 'error',
                content: `Tool execution failed: ${errorMsg}`,
                timestamp: new Date(),
              }
            }
          }
        }
      }

      // 8. Run evaluators
      yield {
        type: 'thought',
        content: '📊 Evaluating performance and extracting learnings...',
        timestamp: new Date(),
      }

      const evaluations = await this.evaluators.evaluateAll(
        this.state.eventLog.slice(-20),
        this.state.sessionId
      )

      // Store learnings in memory
      for (const evaluation of evaluations) {
        for (const fact of evaluation.facts) {
          this.addMemory(this.state.sessionId, fact.type, fact.content, fact.confidence)
        }

        const memoryProvider = this.providers.get('memory') as MemoryProvider
        if (memoryProvider) {
          for (const fact of evaluation.facts) {
            memoryProvider.addMemory(this.state.sessionId, fact.type, fact.content, fact.confidence)
          }
        }
      }

      yield {
        type: 'complete',
        content: '✅ Decision cycle complete',
        timestamp: new Date(),
      }

      this.state.status = 'idle'
    } catch (error) {
      this.state.status = 'error'
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'

      this.eventLogger.logError(this.state.sessionId, errorMsg)

      yield {
        type: 'error',
        content: `Engine error: ${errorMsg}`,
        timestamp: new Date(),
      }
    }

    this.state.lastActivity = new Date()
  }

  /**
   * Run autonomous loop with event-driven architecture
   */
  async *runAutonomousLoop(maxSteps: number = 100): AsyncGenerator<AgentStreamChunk> {
    if (!this.state) {
      throw new Error('Session not initialized')
    }

    yield {
      type: 'thought',
      content: `🚀 Starting autonomous event-driven gameplay for ${maxSteps} steps`,
      timestamp: new Date(),
    }

    for (let step = 0; step < maxSteps && this.state.status === 'idle'; step++) {
      yield {
        type: 'thought',
        content: `\n--- Event Cycle ${step + 1}/${maxSteps} ---`,
        timestamp: new Date(),
      }

      // Run decision cycle
      for await (const chunk of this.decideWithStreaming()) {
        yield chunk
      }

      // Small delay
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    yield {
      type: 'complete',
      content: '🏁 Autonomous gameplay loop completed',
      timestamp: new Date(),
    }
  }

  /**
   * Add memory entry
   */
  private addMemory(sessionId: string, type: string, content: string, confidence: number): void {
    if (!this.memories.has(sessionId)) {
      this.memories.set(sessionId, [])
    }

    const xmlContent = `<memory type="${type}" confidence="${confidence}">${content}</memory>`

    const memory: MemoryEntry = {
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      sessionId,
      type: type as any,
      xmlContent,
      learnedAt: new Date(),
      confidence,
      reinforcements: 0,
      lastAccessedAt: new Date(),
    }

    this.memories.get(sessionId)!.push(memory)
  }

  /**
   * Emit event to listeners
   */
  private async emitEvent(event: EventMessage): Promise<void> {
    const listeners = this.eventListeners.get(event.type) || []

    // Sort by priority
    listeners.sort((a, b) => b.priority - a.priority)

    for (const listener of listeners) {
      if (this.state) {
        await listener.handler(event, this.state)
      }
    }
  }

  /**
   * Register event listener
   */
  on(eventType: string, handler: (event: EventMessage, state: AgentRuntimeState) => Promise<void>, priority: number = 5): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, [])
    }

    this.eventListeners.get(eventType)!.push({
      eventType,
      handler,
      priority,
    })
  }

  /**
   * Get event logs as XML batch
   */
  getEventLogsXML(eventTypes?: string[], limit?: number): string {
    if (!this.state) {
      return '<error>No active session</error>'
    }

    return this.eventLogger.getLogsAsXMLBatch(this.state.sessionId, eventTypes, limit)
  }

  /**
   * Get current state
   */
  getState(): AgentRuntimeState | null {
    return this.state
  }

  /**
   * Pause agent
   */
  pause(): void {
    if (this.state) {
      this.state.status = 'waiting'
    }
  }

  /**
   * Resume agent
   */
  resume(): void {
    if (this.state) {
      this.state.status = 'idle'
    }
  }

  /**
   * Reconstruct game state from XML data (helper)
   */
  private reconstructGameState(xmlData: any): GameState {
    const event = xmlData.event || xmlData.context

    return {
      sessionId: this.state?.sessionId || '',
      environment: event.environment || 'Unknown',
      position: {
        x: parseFloat(event.position?.['@_x']) || 0,
        y: parseFloat(event.position?.['@_y']) || 0,
        z: parseFloat(event.position?.['@_z']) || 0,
      },
      visibleEntities: Array.isArray(event.visibleEntities?.entity)
        ? event.visibleEntities.entity.map((e: any) => ({
            id: e['@_id'],
            type: e['@_type'],
            position: {
              x: parseFloat(e['@_x']) || 0,
              y: parseFloat(e['@_y']) || 0,
            },
            properties: {},
          }))
        : [],
      inventory: Array.isArray(event.inventory?.item)
        ? event.inventory.item.map((i: any) => ({
            id: i['@_id'],
            name: i['@_name'],
            quantity: parseInt(i['@_quantity']) || 1,
          }))
        : [],
      stats: event.stats || {},
      activeQuests: [],
      availableActions: ['move', 'interact', 'attack', 'use_item', 'speak'],
      recentEvents: [],
    }
  }
}
