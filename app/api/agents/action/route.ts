import { NextRequest, NextResponse } from 'next/server'
import { GameAgentEngine } from '@/lib/agents/agent-engine'
import type { GameState } from '@/lib/agents/types'

export const runtime = 'nodejs'
export const maxDuration = 60

// Access active sessions (should be shared with session route)
declare global {
  var agentSessions: Map<string, GameAgentEngine> | undefined
}

const activeSessions = globalThis.agentSessions || new Map<string, GameAgentEngine>()
if (!globalThis.agentSessions) {
  globalThis.agentSessions = activeSessions
}

/**
 * Request agent to make a single decision/action
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, gameState } = body as {
      sessionId: string
      gameState?: GameState
    }

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

    // Update game state if provided
    if (gameState) {
      engine.updateGameState(gameState)
    }

    // Get current game state
    const currentSession = engine.getSession()
    if (!currentSession) {
      return NextResponse.json(
        { error: 'Invalid session state' },
        { status: 500 }
      )
    }

    // Make decision
    const decision = await engine.decideAction(currentSession.gameState)

    // Get updated session
    const updatedSession = engine.getSession()

    return NextResponse.json({
      success: true,
      decision,
      gameState: updatedSession?.gameState,
      totalReward: updatedSession?.totalReward,
    })
  } catch (error) {
    console.error('Agent action error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
