import { streamText, generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import type {
  AgentConfig,
  AgentSession,
  GameState,
  GameAction,
  ActionResult,
  AgentDecision,
  AgentStreamChunk,
} from './types'
import { gameActionTools } from './tools'

/**
 * Game Playing AI Agent Engine
 *
 * This engine powers autonomous AI agents that can play games by:
 * 1. Observing game state
 * 2. Reasoning about actions using streaming LLM
 * 3. Executing actions through tools
 * 4. Learning from outcomes
 */
export class GameAgentEngine {
  private config: AgentConfig
  private session: AgentSession | null = null

  constructor(config: AgentConfig) {
    this.config = config
  }

  /**
   * Initialize a new agent session
   */
  async initializeSession(initialGameState: GameState): Promise<AgentSession> {
    this.session = {
      id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      agent: this.config,
      gameState: initialGameState,
      actionHistory: [],
      reasoningHistory: [],
      totalReward: 0,
      startedAt: new Date(),
      lastActivityAt: new Date(),
      status: 'active',
    }

    return this.session
  }

  /**
   * Get the current session
   */
  getSession(): AgentSession | null {
    return this.session
  }

  /**
   * Update game state in the session
   */
  updateGameState(newState: GameState): void {
    if (!this.session) {
      throw new Error('No active session. Call initializeSession first.')
    }

    this.session.gameState = newState
    this.session.lastActivityAt = new Date()
  }

  /**
   * Build context for the agent's decision-making
   */
  private buildAgentContext(gameState: GameState): string {
    const context = `
## Current Game State

**Environment:** ${gameState.environment}
**Position:** (${gameState.position?.x || 0}, ${gameState.position?.y || 0}, ${gameState.position?.z || 0})

### Stats
${Object.entries(gameState.stats)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}

### Inventory (${gameState.inventory.length} items)
${gameState.inventory.map((item) => `- ${item.name} x${item.quantity}`).join('\n') || 'Empty'}

### Visible Entities (${gameState.visibleEntities.length})
${gameState.visibleEntities
  .map((entity) => {
    const distance = Math.sqrt(
      Math.pow((entity.position.x - (gameState.position?.x || 0)), 2) +
      Math.pow((entity.position.y - (gameState.position?.y || 0)), 2)
    ).toFixed(1)
    return `- ${entity.type} (ID: ${entity.id}) at distance ${distance}`
  })
  .join('\n') || 'None visible'}

### Active Quests (${gameState.activeQuests.length})
${gameState.activeQuests
  .map((quest) => {
    const completed = quest.objectives.filter((o) => o.completed).length
    return `- ${quest.title}: ${completed}/${quest.objectives.length} objectives completed`
  })
  .join('\n') || 'No active quests'}

### Available Actions
${gameState.availableActions.join(', ') || 'No restrictions'}

### Recent Events
${gameState.recentEvents
  .slice(-5)
  .map((event) => `- ${event.type}: ${event.description}`)
  .join('\n') || 'No recent events'}

${
  gameState.dialogueContext
    ? `
### Current Dialogue
Speaking with: ${gameState.dialogueContext.npcName}
Recent conversation:
${gameState.dialogueContext.conversationHistory
  .slice(-3)
  .map((msg) => `${msg.speaker}: ${msg.message}`)
  .join('\n')}
`
    : ''
}
`

    return context.trim()
  }

  /**
   * Build the system prompt for the agent
   */
  private buildSystemPrompt(): string {
    const personality = this.config.personality

    return `${personality.systemPrompt}

## Your Personality
You are ${personality.name}, an AI agent playing a game.

**Traits:** ${personality.traits.join(', ')}
**Play Style:** ${personality.playStyle}
**Primary Goal:** ${personality.goals.primaryGoal}
**Secondary Goals:** ${personality.goals.secondaryGoals.join(', ')}

## Decision Making Preferences
- Risk Tolerance: ${personality.preferences.riskTolerance * 100}%
- Exploration vs Exploitation: ${personality.preferences.explorationVsExploitation * 100}% exploration
- Social Interaction: ${personality.preferences.socialInteraction * 100}%
- Completionism: ${personality.preferences.completionismLevel * 100}%

## Instructions
1. Observe the current game state carefully
2. Think about your goals and the best action to take
3. Use the available tools to take actions in the game
4. Be strategic and consider long-term consequences
5. Stay in character and play according to your personality
6. Explain your reasoning before taking actions

Available tools allow you to: move, interact with entities, attack enemies, use items, speak with NPCs, manage quests, and manage inventory.

Think step by step and make smart decisions!`
  }

  /**
   * Make a decision using streaming (for real-time display)
   */
  async *decideActionStreaming(
    gameState: GameState
  ): AsyncGenerator<AgentStreamChunk> {
    if (!this.session) {
      throw new Error('No active session')
    }

    const systemPrompt = this.buildSystemPrompt()
    const context = this.buildAgentContext(gameState)

    const prompt = `${context}

Based on the current game state and your personality, what action should you take next?

Think through:
1. What is your current situation?
2. What are your immediate priorities?
3. What action will best achieve your goals?
4. What are the potential risks and rewards?

Then use the appropriate tool to take action.`

    // Convert tools to AI SDK format
    const tools = gameActionTools.reduce((acc, tool) => {
      acc[tool.name] = {
        description: tool.description,
        parameters: tool.parameters,
      }
      return acc
    }, {} as Record<string, { description: string; parameters: unknown }>)

    // Get the model
    const model = this.getModel()

    try {
      // Stream the agent's reasoning and tool calls
      const result = streamText({
        model,
        system: systemPrompt,
        prompt,
        tools,
        maxSteps: 5, // Allow multi-step reasoning
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      })

      // Stream the response chunks
      for await (const chunk of result.textStream) {
        yield {
          type: 'thought',
          content: chunk,
          timestamp: new Date(),
        }
      }

      // Get the final result with tool calls
      const finalResult = await result

      // Process tool calls
      if (finalResult.toolCalls && finalResult.toolCalls.length > 0) {
        for (const toolCall of finalResult.toolCalls) {
          yield {
            type: 'tool_call',
            content: `Executing: ${toolCall.toolName}`,
            data: toolCall,
            timestamp: new Date(),
          }

          // Execute the tool
          const tool = gameActionTools.find((t) => t.name === toolCall.toolName)
          if (tool) {
            try {
              const actionResult = await tool.execute(toolCall.args, gameState)

              yield {
                type: 'tool_result',
                content: actionResult.description,
                data: actionResult,
                timestamp: new Date(),
              }

              // Record action in history
              this.session.actionHistory.push({
                action: actionResult.action,
                result: actionResult,
                timestamp: new Date(),
              })

              // Update total reward
              this.session.totalReward += actionResult.reward || 0

              // Update game state
              this.updateGameState(actionResult.newState)
            } catch (error) {
              yield {
                type: 'error',
                content: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: new Date(),
              }
            }
          }
        }
      }

      yield {
        type: 'complete',
        content: 'Decision making complete',
        timestamp: new Date(),
      }
    } catch (error) {
      yield {
        type: 'error',
        content: `Agent error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      }
    }
  }

  /**
   * Make a decision (non-streaming, for autonomous play)
   */
  async decideAction(gameState: GameState): Promise<AgentDecision> {
    if (!this.session) {
      throw new Error('No active session')
    }

    const systemPrompt = this.buildSystemPrompt()
    const context = this.buildAgentContext(gameState)

    const prompt = `${context}

Based on the current game state, decide on the best action to take. Use one of the available tools.`

    // Convert tools to AI SDK format
    const tools = gameActionTools.reduce((acc, tool) => {
      acc[tool.name] = {
        description: tool.description,
        parameters: tool.parameters,
        execute: async (args: Record<string, unknown>) => {
          const result = await tool.execute(args, gameState)
          return result
        },
      }
      return acc
    }, {} as Record<string, unknown>)

    const model = this.getModel()

    // Generate decision
    const result = await generateText({
      model,
      system: systemPrompt,
      prompt,
      tools: tools as any,
      maxSteps: 3,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    })

    // Extract the decision
    let action: GameAction = { type: 'wait', parameters: {} }
    let reasoning = result.text

    if (result.toolCalls && result.toolCalls.length > 0) {
      const toolCall = result.toolCalls[0]
      action = {
        type: toolCall.toolName,
        parameters: toolCall.args,
      }

      // Execute the tool to get the result
      const tool = gameActionTools.find((t) => t.name === toolCall.toolName)
      if (tool) {
        const actionResult = await tool.execute(toolCall.args, gameState)

        // Record action
        this.session.actionHistory.push({
          action: actionResult.action,
          result: actionResult,
          timestamp: new Date(),
        })

        // Update reward
        this.session.totalReward += actionResult.reward || 0

        // Update game state
        this.updateGameState(actionResult.newState)
      }
    }

    const decision: AgentDecision = {
      reasoning,
      action,
      confidence: 0.8, // Could be calculated based on model confidence
    }

    // Record reasoning
    this.session.reasoningHistory.push({
      thought: reasoning,
      action,
      timestamp: new Date(),
    })

    return decision
  }

  /**
   * Run autonomous gameplay loop
   */
  async *runAutonomousLoop(
    maxSteps: number = 100
  ): AsyncGenerator<AgentStreamChunk> {
    if (!this.session) {
      throw new Error('No active session')
    }

    yield {
      type: 'thought',
      content: `Starting autonomous gameplay as ${this.config.personality.name}`,
      timestamp: new Date(),
    }

    for (let step = 0; step < maxSteps; step++) {
      if (this.session.status !== 'active') {
        yield {
          type: 'complete',
          content: `Session ended with status: ${this.session.status}`,
          timestamp: new Date(),
        }
        break
      }

      yield {
        type: 'thought',
        content: `\n--- Step ${step + 1}/${maxSteps} ---`,
        timestamp: new Date(),
      }

      // Make a decision and stream the results
      for await (const chunk of this.decideActionStreaming(this.session.gameState)) {
        yield chunk
      }

      // Small delay between actions
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  /**
   * Get the LLM model based on config
   */
  private getModel() {
    if (this.config.model.startsWith('gpt')) {
      return openai(this.config.model)
    } else {
      return anthropic(this.config.model)
    }
  }

  /**
   * Pause the agent session
   */
  pauseSession(): void {
    if (this.session) {
      this.session.status = 'paused'
    }
  }

  /**
   * Resume the agent session
   */
  resumeSession(): void {
    if (this.session) {
      this.session.status = 'active'
    }
  }

  /**
   * End the agent session
   */
  endSession(status: 'completed' | 'failed' = 'completed'): void {
    if (this.session) {
      this.session.status = status
    }
  }

  /**
   * Get session statistics
   */
  getStatistics() {
    if (!this.session) {
      return null
    }

    const duration = new Date().getTime() - this.session.startedAt.getTime()
    const actionsPerMinute = (this.session.actionHistory.length / duration) * 60000

    return {
      totalActions: this.session.actionHistory.length,
      totalReward: this.session.totalReward,
      averageReward: this.session.totalReward / Math.max(this.session.actionHistory.length, 1),
      duration,
      actionsPerMinute,
      successRate: this.session.actionHistory.filter((a) => a.result.success).length /
        Math.max(this.session.actionHistory.length, 1),
    }
  }
}
