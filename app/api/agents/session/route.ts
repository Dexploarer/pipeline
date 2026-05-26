// @deprecated - Use /api/agents-v2/ endpoints instead. This route will be removed in a future version.
import { NextRequest, NextResponse } from 'next/server'
import { GameAgentEngine } from '@/lib/agents/agent-engine'
import type { AgentConfig, GameState } from '@/lib/agents/types'
import { getUserFromRequest } from '@/lib/auth/session'

export const runtime = 'nodejs'
export const maxDuration = 60

// Store active sessions (in production, use Redis or database)
declare global {
  var agentSessions: Map<string, GameAgentEngine> | undefined
}

const activeSessions = globalThis.agentSessions || new Map<string, GameAgentEngine>()
if (!globalThis.agentSessions) {
  globalThis.agentSessions = activeSessions
}

function addDeprecationHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Deprecated", "true")
  response.headers.set("X-Deprecated-Message", "Use /api/agents-v2/ instead")
  return response
}

/**
 * Initialize a new agent session
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const user = await getUserFromRequest(authHeader)
    if (!user) {
      return addDeprecationHeaders(NextResponse.json({ error: "Authentication required" }, { status: 401 }))
    }

    const body = await req.json()
    const { agentConfig, gameState } = body as {
      agentConfig: AgentConfig
      gameState: GameState
    }

    if (!agentConfig || !gameState) {
      return addDeprecationHeaders(NextResponse.json(
        { error: 'Agent config and game state are required' },
        { status: 400 }
      ))
    }

    // Create agent engine
    const engine = new GameAgentEngine(agentConfig)

    // Initialize session
    const session = await engine.initializeSession(gameState)

    // Store session
    activeSessions.set(session.id, engine)

    return addDeprecationHeaders(NextResponse.json({
      success: true,
      session: {
        id: session.id,
        agentId: agentConfig.id,
        status: session.status,
        startedAt: session.startedAt,
      },
    }))
  } catch (error) {
    console.error('Session initialization error:', error)
    return addDeprecationHeaders(NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    ))
  }
}

/**
 * Get session status
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const user = await getUserFromRequest(authHeader)
    if (!user) {
      return addDeprecationHeaders(NextResponse.json({ error: "Authentication required" }, { status: 401 }))
    }

    const sessionId = req.nextUrl.searchParams.get('sessionId')

    if (!sessionId) {
      return addDeprecationHeaders(NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      ))
    }

    const engine = activeSessions.get(sessionId)

    if (!engine) {
      return addDeprecationHeaders(NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      ))
    }

    const session = engine.getSession()
    const statistics = engine.getStatistics()

    return addDeprecationHeaders(NextResponse.json({
      success: true,
      session: {
        id: session?.id,
        status: session?.status,
        gameState: session?.gameState,
        actionHistory: session?.actionHistory?.slice(-10) ?? [], // Last 10 actions
        totalReward: session?.totalReward,
        statistics,
      },
    }))
  } catch (error) {
    console.error('Get session error:', error)
    return addDeprecationHeaders(NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    ))
  }
}

/**
 * Update session (pause/resume/end)
 */
export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const user = await getUserFromRequest(authHeader)
    if (!user) {
      return addDeprecationHeaders(NextResponse.json({ error: "Authentication required" }, { status: 401 }))
    }

    const body = await req.json()
    const { sessionId, action } = body

    if (!sessionId || !action) {
      return addDeprecationHeaders(NextResponse.json(
        { error: 'Session ID and action are required' },
        { status: 400 }
      ))
    }

    const engine = activeSessions.get(sessionId)

    if (!engine) {
      return addDeprecationHeaders(NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      ))
    }

    switch (action) {
      case 'pause':
        engine.pauseSession()
        break
      case 'resume':
        engine.resumeSession()
        break
      case 'end':
        engine.endSession()
        activeSessions.delete(sessionId)
        break
      default:
        return addDeprecationHeaders(NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        ))
    }

    return addDeprecationHeaders(NextResponse.json({
      success: true,
      session: engine.getSession(),
    }))
  } catch (error) {
    console.error('Update session error:', error)
    return addDeprecationHeaders(NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    ))
  }
}

// Cleanup function to remove old sessions (call periodically)
// Note: Not exported as it's not a valid Next.js route handler
function cleanupOldSessions() {
  const now = Date.now()
  for (const [sessionId, engine] of activeSessions.entries()) {
    const session = engine.getSession()
    if (session && now - session.lastActivityAt.getTime() > 3600000) {
      // 1 hour
      activeSessions.delete(sessionId)
    }
  }
}

// Run cleanup on module load (in production, use a cron job)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldSessions, 3600000) // Every hour
}
