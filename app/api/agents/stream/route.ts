import { NextRequest } from 'next/server'
import { GameAgentEngine } from '@/lib/agents/agent-engine'
import type { GameState } from '@/lib/agents/types'

export const runtime = 'nodejs'
export const maxDuration = 300

// Access active sessions
declare global {
  var agentSessions: Map<string, GameAgentEngine> | undefined
}

const activeSessions = globalThis.agentSessions || new Map<string, GameAgentEngine>()
if (!globalThis.agentSessions) {
  globalThis.agentSessions = activeSessions
}

/**
 * Stream agent decision-making process in real-time
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, gameState, mode = 'single' } = body as {
      sessionId: string
      gameState?: GameState
      mode?: 'single' | 'autonomous'
    }

    if (!sessionId) {
      return new Response('Session ID is required', { status: 400 })
    }

    const engine = activeSessions.get(sessionId)

    if (!engine) {
      return new Response('Session not found', { status: 404 })
    }

    // Update game state if provided
    if (gameState) {
      engine.updateGameState(gameState)
    }

    const currentSession = engine.getSession()
    if (!currentSession) {
      return new Response('Invalid session state', { status: 500 })
    }

    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        try {
          if (mode === 'autonomous') {
            // Stream autonomous gameplay loop
            for await (const chunk of engine.runAutonomousLoop(100)) {
              const data = `data: ${JSON.stringify(chunk)}\n\n`
              controller.enqueue(encoder.encode(data))
            }
          } else {
            // Stream single decision
            for await (const chunk of engine.decideActionStreaming(currentSession.gameState)) {
              const data = `data: ${JSON.stringify(chunk)}\n\n`
              controller.enqueue(encoder.encode(data))
            }
          }

          // Send final session state
          const finalSession = engine.getSession()
          const finalData = `data: ${JSON.stringify({
            type: 'session_update',
            content: 'Session updated',
            data: {
              totalReward: finalSession?.totalReward,
              actionCount: finalSession?.actionHistory.length,
            },
            timestamp: new Date(),
          })}\n\n`
          controller.enqueue(encoder.encode(finalData))

          controller.close()
        } catch (error) {
          const errorData = `data: ${JSON.stringify({
            type: 'error',
            content: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
          })}\n\n`
          controller.enqueue(encoder.encode(errorData))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Stream error:', error)
    return new Response(
      error instanceof Error ? error.message : 'Unknown error',
      { status: 500 }
    )
  }
}
