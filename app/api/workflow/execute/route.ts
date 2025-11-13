import { NextRequest, NextResponse } from 'next/server'
import { WorkflowExecutor } from '@/lib/workflow/executor'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for workflow execution

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nodes, edges, input } = body

    if (!nodes || !edges) {
      return NextResponse.json(
        { error: 'Nodes and edges are required' },
        { status: 400 }
      )
    }

    // Execute the workflow
    const executor = new WorkflowExecutor()
    const result = await executor.execute(nodes, edges, input || {})

    return NextResponse.json({
      success: result.status === 'completed',
      executionId: result.executionId,
      status: result.status,
      results: result.context.results,
      completedNodes: result.completedNodes,
      failedNodes: result.failedNodes,
      error: result.error,
      duration: result.completedAt
        ? new Date(result.completedAt).getTime() - new Date(result.createdAt).getTime()
        : null,
    })
  } catch (error) {
    console.error('Workflow execution error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
