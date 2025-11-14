import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { workflowRunId, status, error } = body

    // Log the failure
    console.error('Workflow failure logged:', {
      workflowRunId,
      status,
      error,
      timestamp: new Date().toISOString(),
    })

    // In production, you would:
    // 1. Store this in a failures table
    // 2. Send alerts/notifications
    // 3. Trigger retry logic if appropriate
    // 4. Update monitoring dashboards

    return NextResponse.json({
      success: true,
      logged: true,
      workflowRunId,
    })
  } catch (error) {
    console.error('Failure logging error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
