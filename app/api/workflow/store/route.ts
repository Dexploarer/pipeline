import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@neondatabase/serverless'
import { neon } from '@/lib/db/client'

export const runtime = 'edge'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { workflowRunId, npcData } = body

    if (!workflowRunId || !npcData) {
      return NextResponse.json(
        { error: 'Workflow run ID and NPC data are required' },
        { status: 400 }
      )
    }

    const client = neon(process.env.DATABASE_URL!)

    // Store workflow execution results
    // Note: You may need to create a workflows table in your database schema
    const result = await client`
      INSERT INTO workflow_executions (
        workflow_run_id,
        npc_data,
        status,
        created_at
      ) VALUES (
        ${workflowRunId},
        ${JSON.stringify(npcData)},
        'completed',
        NOW()
      )
      ON CONFLICT (workflow_run_id)
      DO UPDATE SET
        npc_data = ${JSON.stringify(npcData)},
        status = 'completed',
        updated_at = NOW()
      RETURNING id
    `

    return NextResponse.json({
      success: true,
      workflowRunId,
      storedId: result[0]?.id,
    })
  } catch (error) {
    console.error('Workflow storage error:', error)

    // If table doesn't exist, return success anyway (graceful degradation)
    if (error instanceof Error && error.message.includes('does not exist')) {
      console.warn('workflow_executions table does not exist. Skipping storage.')
      return NextResponse.json({
        success: true,
        warning: 'Storage table not available',
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
