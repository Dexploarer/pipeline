import { NextRequest, NextResponse } from 'next/server'
import { EventDrivenAgentEngine } from '@/lib/agents/event-driven-engine'

export const runtime = 'nodejs'
export const maxDuration = 30

// Access event-driven sessions
declare global {
  var eventDrivenSessions: Map<string, EventDrivenAgentEngine> | undefined
}

const activeSessions = globalThis.eventDrivenSessions || new Map<string, EventDrivenAgentEngine>()
if (!globalThis.eventDrivenSessions) {
  globalThis.eventDrivenSessions = activeSessions
}

/**
 * Get XML event logs for a session
 */
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId')
    const eventTypes = req.nextUrl.searchParams.get('eventTypes')?.split(',')
    const rawLimit = req.nextUrl.searchParams.get('limit')
    const requestedLimit = rawLimit ? Number.parseInt(rawLimit, 10) : 50
    const limit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? requestedLimit : 50

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

    // Get XML logs
    const xmlLogs = engine.getEventLogsXML(eventTypes, limit)

    return new Response(xmlLogs, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="agent-logs-${sessionId}.xml"`,
      },
    })
  } catch (error) {
    console.error('Get XML logs error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
