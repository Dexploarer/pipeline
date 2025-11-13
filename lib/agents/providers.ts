import { XMLBuilder } from 'fast-xml-parser'
import type { Provider, ProviderContext } from './event-types'
import type { GameState } from './types'

/**
 * Providers supply context to the agent (inspired by ElizaOS)
 * Each provider gathers specific information and formats it as XML
 */

const xmlBuilder = new XMLBuilder({
  ignoreAttributes: false,
  format: true,
  suppressEmptyNode: true,
})

/**
 * Game State Provider - provides current game state
 */
export class GameStateProvider implements Provider {
  name = 'gameState'
  description = 'Provides current game state including position, entities, inventory, and stats'

  private gameStates: Map<string, GameState> = new Map()

  setGameState(sessionId: string, gameState: GameState): void {
    this.gameStates.set(sessionId, gameState)
  }

  async get(sessionId: string): Promise<ProviderContext> {
    const gameState = this.gameStates.get(sessionId)

    if (!gameState) {
      return {
        providerName: this.name,
        xml: '<context type="gameState"><error>No game state available</error></context>',
        priority: 10,
      }
    }

    const xml = xmlBuilder.build({
      context: {
        '@_type': 'gameState',
        '@_timestamp': new Date().toISOString(),
        environment: gameState.environment,
        position: {
          '@_x': gameState.position?.x || 0,
          '@_y': gameState.position?.y || 0,
          '@_z': gameState.position?.z || 0,
        },
        stats: gameState.stats,
        inventory: {
          '@_count': gameState.inventory?.length || 0,
          item: gameState.inventory?.map((item) => ({
            '@_id': item.id,
            '@_name': item.name,
            '@_quantity': item.quantity,
          })) || [],
        },
        visibleEntities: {
          '@_count': gameState.visibleEntities?.length || 0,
          entity: gameState.visibleEntities?.map((entity) => ({
            '@_id': entity.id,
            '@_type': entity.type,
            '@_distance': Math.sqrt(
              Math.pow((entity.position.x - (gameState.position?.x || 0)), 2) +
              Math.pow((entity.position.y - (gameState.position?.y || 0)), 2)
            ).toFixed(2),
          })) || [],
        },
        activeQuests: {
          '@_count': gameState.activeQuests?.length || 0,
          quest: gameState.activeQuests?.map((quest) => ({
            '@_id': quest.id,
            '@_title': quest.title,
            '@_progress': `${quest.objectives.filter(o => o.completed).length}/${quest.objectives.length}`,
          })) || [],
        },
      },
    })

    return {
      providerName: this.name,
      xml,
      priority: 10,
    }
  }
}

/**
 * Memory Provider - provides relevant memories from past experiences
 */
export class MemoryProvider implements Provider {
  name = 'memory'
  description = 'Provides relevant memories and learned facts from past experiences'

  private memories: Map<string, Array<{ type: string; content: string; confidence: number }>> = new Map()

  addMemory(sessionId: string, type: string, content: string, confidence: number): void {
    if (!this.memories.has(sessionId)) {
      this.memories.set(sessionId, [])
    }
    this.memories.get(sessionId)!.push({ type, content, confidence })
  }

  async get(sessionId: string): Promise<ProviderContext> {
    const sessionMemories = this.memories.get(sessionId) || []
    const recentMemories = sessionMemories.slice(-20) // Last 20 memories

    const xml = xmlBuilder.build({
      context: {
        '@_type': 'memory',
        '@_timestamp': new Date().toISOString(),
        '@_count': recentMemories.length,
        memories: {
          memory: recentMemories.map((mem, idx) => ({
            '@_id': idx,
            '@_type': mem.type,
            '@_confidence': mem.confidence,
            content: mem.content,
          })),
        },
      },
    })

    return {
      providerName: this.name,
      xml,
      priority: 8,
    }
  }
}

/**
 * Goal Provider - provides current goals and objectives
 */
export class GoalProvider implements Provider {
  name = 'goals'
  description = 'Provides agent goals and current objectives'

  private goals: Map<string, { primary: string; secondary: string[]; priorities: Record<string, number> }> = new Map()

  setGoals(sessionId: string, primary: string, secondary: string[], priorities?: Record<string, number>): void {
    this.goals.set(sessionId, { primary, secondary, priorities: priorities || {} })
  }

  async get(sessionId: string): Promise<ProviderContext> {
    const goals = this.goals.get(sessionId)

    if (!goals) {
      return {
        providerName: this.name,
        xml: '<context type="goals"><error>No goals set</error></context>',
        priority: 5,
      }
    }

    const xml = xmlBuilder.build({
      context: {
        '@_type': 'goals',
        '@_timestamp': new Date().toISOString(),
        primaryGoal: goals.primary,
        secondaryGoals: {
          goal: goals.secondary.map((goal) => ({
            '@_priority': goals.priorities[goal] || 1,
            content: goal,
          })),
        },
      },
    })

    return {
      providerName: this.name,
      xml,
      priority: 9,
    }
  }
}

/**
 * Performance Provider - provides agent performance metrics
 */
export class PerformanceProvider implements Provider {
  name = 'performance'
  description = 'Provides agent performance statistics and metrics'

  private stats: Map<string, { totalReward: number; actionCount: number; successRate: number }> = new Map()

  updateStats(sessionId: string, totalReward: number, actionCount: number, successRate: number): void {
    this.stats.set(sessionId, { totalReward, actionCount, successRate })
  }

  async get(sessionId: string): Promise<ProviderContext> {
    const stats = this.stats.get(sessionId) || { totalReward: 0, actionCount: 0, successRate: 0 }

    const xml = xmlBuilder.build({
      context: {
        '@_type': 'performance',
        '@_timestamp': new Date().toISOString(),
        metrics: {
          totalReward: stats.totalReward,
          actionCount: stats.actionCount,
          successRate: (stats.successRate * 100).toFixed(1) + '%',
          averageReward: stats.actionCount > 0 ? (stats.totalReward / stats.actionCount).toFixed(2) : 0,
        },
      },
    })

    return {
      providerName: this.name,
      xml,
      priority: 3,
    }
  }
}

/**
 * Recent Events Provider - provides recent event history
 */
export class RecentEventsProvider implements Provider {
  name = 'recentEvents'
  description = 'Provides recent game events and observations'

  private events: Map<string, Array<{ type: string; description: string; timestamp: Date }>> = new Map()

  addEvent(sessionId: string, type: string, description: string): void {
    if (!this.events.has(sessionId)) {
      this.events.set(sessionId, [])
    }
    const sessionEvents = this.events.get(sessionId)!
    sessionEvents.push({ type, description, timestamp: new Date() })

    // Keep only last 50 events
    if (sessionEvents.length > 50) {
      sessionEvents.shift()
    }
  }

  async get(sessionId: string): Promise<ProviderContext> {
    const events = (this.events.get(sessionId) || []).slice(-10) // Last 10 events

    const xml = xmlBuilder.build({
      context: {
        '@_type': 'recentEvents',
        '@_timestamp': new Date().toISOString(),
        '@_count': events.length,
        events: {
          event: events.map((evt) => ({
            '@_type': evt.type,
            '@_timestamp': evt.timestamp.toISOString(),
            description: evt.description,
          })),
        },
      },
    })

    return {
      providerName: this.name,
      xml,
      priority: 7,
    }
  }
}

/**
 * Provider Registry - manages all providers
 */
export class ProviderRegistry {
  private providers: Map<string, Provider> = new Map()

  register(provider: Provider): void {
    this.providers.set(provider.name, provider)
  }

  get(name: string): Provider | undefined {
    return this.providers.get(name)
  }

  async getAllContexts(sessionId: string): Promise<ProviderContext[]> {
    const contexts: ProviderContext[] = []

    for (const provider of this.providers.values()) {
      try {
        const context = await provider.get(sessionId)
        contexts.push(context)
      } catch (error) {
        console.error(`Provider ${provider.name} failed:`, error)
      }
    }

    // Sort by priority (higher first)
    return contexts.sort((a, b) => b.priority - a.priority)
  }

  getAll(): Provider[] {
    return Array.from(this.providers.values())
  }
}

/**
 * Create default provider registry with all standard providers
 */
export function createDefaultProviders(): ProviderRegistry {
  const registry = new ProviderRegistry()

  registry.register(new GameStateProvider())
  registry.register(new MemoryProvider())
  registry.register(new GoalProvider())
  registry.register(new PerformanceProvider())
  registry.register(new RecentEventsProvider())

  return registry
}
