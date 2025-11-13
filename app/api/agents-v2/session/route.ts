import { NextRequest, NextResponse } from 'next/server'
import { EventDrivenAgentEngine } from '@/lib/agents/event-driven-engine'
import type { AgentConfig, GameState } from '@/lib/agents/types'

export const runtime = 'nodejs'
export const maxDuration = 60

// Store active event-driven sessions
declare global {
  var eventDrivenSessions: Map<string, EventDrivenAgentEngine> | undefined
}

const activeSessions = globalThis.eventDrivenSessions || new Map<string, EventDrivenAgentEngine>()
if (!globalThis.eventDrivenSessions) {
  globalThis.eventDrivenSessions = activeSessions
}

/**
 * Initialize event-driven agent session
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agentConfig, gameState } = body as {
      agentConfig: AgentConfig
      gameState: GameState
    }

    if (!agentConfig || !gameState) {
      return NextResponse.json(
        { error: 'Agent config and game state are required' },
        { status: 400 }
      )
    }

    // Create event-driven engine
    const engine = new EventDrivenAgentEngine(agentConfig)

    // Initialize session
    const sessionId = await engine.initializeSession(gameState)

    // Store session
    activeSessions.set(sessionId, engine)

    return NextResponse.json({
      success: true,
      sessionId,
      agentId: agentConfig.id,
      architecture: 'event-driven',
      features: [
        'XML event logging',
        'Provider context injection',
        'Evaluator learning',
        'Template-based prompts',
        'Memory system',
      ],
    })
  } catch (error) {
    console.error('Event-driven session initialization error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Get event-driven session status
 */
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const engine = activeSessions.get(sessionId)

    if (!engine) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    const state = engine.getState()

    return NextResponse.json({
      success: true,
      sessionId,
      status: state?.status,
      eventLogSize: state?.eventLog.length,
      memorySize: state?.memory.length,
      lastActivity: state?.lastActivity,
      architecture: 'event-driven-xml',
    })
  } catch (error) {
    console.error('Get event-driven session error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Control session (pause/resume)
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, action } = body

    if (!sessionId || !action) {
      return NextResponse.json(
        { error: 'Session ID and action are required' },
        { status: 400 }
      )
    }

    const engine = activeSessions.get(sessionId)

    if (!engine) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    switch (action) {
      case 'pause':
        engine.pause()
        break
      case 'resume':
        engine.resume()
        break
      case 'end':
        activeSessions.delete(sessionId)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      sessionId,
      action,
      status: engine.getState()?.status,
    })
  } catch (error) {
    console.error('Control event-driven session error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
