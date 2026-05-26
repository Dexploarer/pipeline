import { NextRequest } from 'next/server'
import type { GameState } from '@/lib/agents/types'
import { getUserFromRequest } from '@/lib/auth/session'
import { sessionStore } from '@/lib/agents/session-store'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * Stream event-driven agent decision-making
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const user = await getUserFromRequest(authHeader)
    if (!user) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { sessionId, gameState, mode = 'single' } = body as {
      sessionId: string
      gameState?: GameState
      mode?: 'single' | 'autonomous'
    }

    if (!sessionId) {
      return new Response('Session ID is required', { status: 400 })
    }

    const engine = sessionStore.get(sessionId)

    if (!engine) {
      return new Response('Session not found', { status: 404 })
    }

    // Update game state if provided
    if (gameState) {
      await engine.processGameStateEvent(gameState)
    }

    // Create Server-Sent Events stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        try {
          // Send initial message
          const initData = `data: ${JSON.stringify({
            type: 'init',
            content: 'Event-driven agent starting (XML logs + providers + evaluators)',
            architecture: 'ElizaOS-inspired',
            timestamp: new Date(),
          })}\n\n`
          controller.enqueue(encoder.encode(initData))

          if (mode === 'autonomous') {
            // Stream autonomous gameplay loop
            for await (const chunk of engine.runAutonomousLoop(100)) {
              const data = `data: ${JSON.stringify(chunk)}\n\n`
              controller.enqueue(encoder.encode(data))
            }
          } else {
            // Stream single decision
            for await (const chunk of engine.decideWithStreaming()) {
              const data = `data: ${JSON.stringify(chunk)}\n\n`
              controller.enqueue(encoder.encode(data))
            }
          }

          // Send event logs as XML
          const eventLogsXML = engine.getEventLogsXML()
          const logsData = `data: ${JSON.stringify({
            type: 'xml_logs',
            content: 'Event logs (XML)',
            data: { xml: eventLogsXML },
            timestamp: new Date(),
          })}\n\n`
          controller.enqueue(encoder.encode(logsData))

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
    console.error('Event-driven stream error:', error)
    return new Response(
      error instanceof Error ? error.message : 'Unknown error',
      { status: 500 }
    )
  }
}
