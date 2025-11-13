import { XMLBuilder, XMLParser } from 'fast-xml-parser'
import type { XMLEvent, EventLog, EventMessage } from './event-types'

/**
 * XML Event Logger
 * Handles all event logging in XML format for agent interactions
 */
export class XMLEventLogger {
  private xmlBuilder: XMLBuilder
  private xmlParser: XMLParser
  private logs: Map<string, EventLog[]> = new Map()

  constructor() {
    this.xmlBuilder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
      suppressEmptyNode: true,
    })

    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      parseAttributeValue: true,
    })
  }

  /**
   * Log a game state event
   */
  logGameState(sessionId: string, gameState: Record<string, unknown>): XMLEvent {
    const xml = this.xmlBuilder.build({
      event: {
        '@_type': 'game_state',
        '@_timestamp': new Date().toISOString(),
        environment: gameState.environment,
        position: {
          '@_x': (gameState.position as any)?.x || 0,
          '@_y': (gameState.position as any)?.y || 0,
          '@_z': (gameState.position as any)?.z || 0,
        },
        stats: gameState.stats || {},
        inventory: {
          item: Array.isArray(gameState.inventory)
            ? (gameState.inventory as any[]).map((item) => ({
                '@_id': item.id,
                '@_name': item.name,
                '@_quantity': item.quantity,
              }))
            : [],
        },
        visibleEntities: {
          entity: Array.isArray((gameState as any).visibleEntities)
            ? ((gameState as any).visibleEntities as any[]).map((entity) => ({
                '@_id': entity.id,
                '@_type': entity.type,
                '@_x': entity.position?.x || 0,
                '@_y': entity.position?.y || 0,
              }))
            : [],
        },
      },
    })

    const event: XMLEvent = {
      type: 'game_state',
      timestamp: new Date(),
      xml,
      data: gameState,
      source: 'game_engine',
      metadata: { sessionId, tags: ['state', 'observation'] },
    }

    this.storeLog(sessionId, 'game_state', xml, 'info')
    return event
  }

  /**
   * Log an action taken by the agent
   */
  logAction(
    sessionId: string,
    actionType: string,
    parameters: Record<string, unknown>,
    result?: { success: boolean; description: string; reward?: number }
  ): XMLEvent {
    const xml = this.xmlBuilder.build({
      event: {
        '@_type': 'action',
        '@_timestamp': new Date().toISOString(),
        action: {
          '@_type': actionType,
          parameters,
          result: result
            ? {
                '@_success': result.success,
                '@_reward': result.reward || 0,
                description: result.description,
              }
            : undefined,
        },
      },
    })

    const event: XMLEvent = {
      type: 'action',
      timestamp: new Date(),
      xml,
      data: { actionType, parameters, result },
      source: 'agent',
      metadata: { sessionId, tags: ['action', 'execution'] },
    }

    this.storeLog(sessionId, 'action', xml, result?.success ? 'info' : 'warning')
    return event
  }

  /**
   * Log agent's thought/reasoning
   */
  logThought(sessionId: string, thought: string, context?: Record<string, unknown>): XMLEvent {
    const xml = this.xmlBuilder.build({
      event: {
        '@_type': 'thought',
        '@_timestamp': new Date().toISOString(),
        thought: {
          content: thought,
          context: context || {},
        },
      },
    })

    const event: XMLEvent = {
      type: 'thought',
      timestamp: new Date(),
      xml,
      data: { thought, context },
      source: 'agent',
      metadata: { sessionId, tags: ['reasoning', 'cognitive'] },
    }

    this.storeLog(sessionId, 'thought', xml, 'debug')
    return event
  }

  /**
   * Log an observation made by the agent
   */
  logObservation(
    sessionId: string,
    observation: string,
    details?: Record<string, unknown>
  ): XMLEvent {
    const xml = this.xmlBuilder.build({
      event: {
        '@_type': 'observation',
        '@_timestamp': new Date().toISOString(),
        observation: {
          content: observation,
          details: details || {},
        },
      },
    })

    const event: XMLEvent = {
      type: 'observation',
      timestamp: new Date(),
      xml,
      data: { observation, details },
      source: 'agent',
      metadata: { sessionId, tags: ['perception', 'sensor'] },
    }

    this.storeLog(sessionId, 'observation', xml, 'info')
    return event
  }

  /**
   * Log a reward received
   */
  logReward(sessionId: string, reward: number, reason: string): XMLEvent {
    const xml = this.xmlBuilder.build({
      event: {
        '@_type': 'reward',
        '@_timestamp': new Date().toISOString(),
        reward: {
          '@_value': reward,
          '@_reason': reason,
        },
      },
    })

    const event: XMLEvent = {
      type: 'reward',
      timestamp: new Date(),
      xml,
      data: { reward, reason },
      source: 'environment',
      metadata: { sessionId, tags: ['feedback', 'learning'] },
    }

    this.storeLog(sessionId, 'reward', xml, 'info')
    return event
  }

  /**
   * Log an error
   */
  logError(sessionId: string, error: string, details?: Record<string, unknown>): XMLEvent {
    const xml = this.xmlBuilder.build({
      event: {
        '@_type': 'error',
        '@_timestamp': new Date().toISOString(),
        error: {
          message: error,
          details: details || {},
        },
      },
    })

    const event: XMLEvent = {
      type: 'error',
      timestamp: new Date(),
      xml,
      data: { error, details },
      source: 'system',
      metadata: { sessionId, tags: ['error', 'exception'] },
    }

    this.storeLog(sessionId, 'error', xml, 'error')
    return event
  }

  /**
   * Log a generic message
   */
  logMessage(
    sessionId: string,
    from: string,
    to: string,
    content: string,
    type: string = 'user_input'
  ): EventMessage {
    const xml = this.xmlBuilder.build({
      message: {
        '@_type': type,
        '@_from': from,
        '@_to': to,
        '@_timestamp': new Date().toISOString(),
        content,
      },
    })

    const message: EventMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type: type as any,
      xml,
      content: { text: content },
      from,
      to,
      timestamp: new Date(),
    }

    this.storeLog(sessionId, 'message', xml, 'info')
    return message
  }

  /**
   * Store log entry
   */
  private storeLog(
    sessionId: string,
    eventType: string,
    xmlContent: string,
    level: 'debug' | 'info' | 'warning' | 'error'
  ): void {
    if (!this.logs.has(sessionId)) {
      this.logs.set(sessionId, [])
    }

    const log: EventLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      sessionId,
      eventType,
      xmlContent,
      timestamp: new Date(),
      level,
    }

    const sessionLogs = this.logs.get(sessionId)!
    sessionLogs.push(log)

    // Keep only last 1000 logs per session
    if (sessionLogs.length > 1000) {
      sessionLogs.shift()
    }
  }

  /**
   * Get logs for a session
   */
  getLogs(sessionId: string, eventType?: string, limit: number = 100): EventLog[] {
    const logs = this.logs.get(sessionId) || []

    let filtered = logs
    if (eventType) {
      filtered = logs.filter((log) => log.eventType === eventType)
    }

    return filtered.slice(-limit)
  }

  /**
   * Get logs as XML batch
   */
  getLogsAsXMLBatch(sessionId: string, eventTypes?: string[], limit: number = 50): string {
    const logs = this.getLogs(sessionId, undefined, limit)
    const filtered = eventTypes
      ? logs.filter((log) => eventTypes.includes(log.eventType))
      : logs

    const batch = {
      eventBatch: {
        '@_sessionId': sessionId,
        '@_count': filtered.length,
        events: {
          event: filtered.map((log) => ({
            '@_type': log.eventType,
            '@_timestamp': log.timestamp.toISOString(),
            '@_level': log.level,
            content: log.xmlContent,
          })),
        },
      },
    }

    return this.xmlBuilder.build(batch)
  }

  /**
   * Parse XML to event data
   */
  parseXML(xml: string): Record<string, unknown> {
    return this.xmlParser.parse(xml)
  }

  /**
   * Clear logs for a session
   */
  clearLogs(sessionId: string): void {
    this.logs.delete(sessionId)
  }

  /**
   * Get all session IDs with logs
   */
  getActiveSessions(): string[] {
    return Array.from(this.logs.keys())
  }
}

/**
 * Global XML event logger instance
 */
export const globalEventLogger = new XMLEventLogger()
