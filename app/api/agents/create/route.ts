import { NextRequest, NextResponse } from 'next/server'
import type { AgentConfig } from '@/lib/agents/types'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Create a new AI agent configuration
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, playStyle, goals, model = 'claude-sonnet-4-5-20250929' } = body

    if (!name || !playStyle) {
      return NextResponse.json(
        { error: 'Name and play style are required' },
        { status: 400 }
      )
    }

    // Create agent configuration
    const agentConfig: AgentConfig = {
      id: `agent_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      personality: {
        name,
        traits: body.traits || [],
        playStyle,
        goals: goals || {
          primaryGoal: 'Explore and complete quests',
          secondaryGoals: ['Collect items', 'Level up'],
        },
        preferences: {
          riskTolerance: body.riskTolerance ?? 0.5,
          explorationVsExploitation: body.explorationVsExploitation ?? 0.6,
          socialInteraction: body.socialInteraction ?? 0.5,
          completionismLevel: body.completionismLevel ?? 0.7,
        },
        systemPrompt: generateSystemPrompt(name, playStyle, goals),
      },
      model,
      temperature: body.temperature ?? 0.7,
      maxTokens: body.maxTokens ?? 2000,
      streaming: body.streaming ?? true,
      toolTimeout: 30000,
      maxAutonomousActions: body.maxAutonomousActions ?? 100,
    }

    return NextResponse.json({
      success: true,
      agent: agentConfig,
    })
  } catch (error) {
    console.error('Agent creation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

function generateSystemPrompt(name: string, playStyle: string, goals: any): string {
  return `You are ${name}, an advanced AI agent designed to play games autonomously.

Your play style is ${playStyle}, which means you should make decisions that align with this approach.

You have access to various tools that allow you to interact with the game world:
- Movement tools to navigate the environment
- Combat tools to engage with enemies
- Social tools to interact with NPCs
- Inventory management tools
- Quest management tools

Always think strategically and consider both short-term actions and long-term goals.
Explain your reasoning before taking actions.
Be creative and adapt to different situations.
Learn from outcomes and adjust your strategy accordingly.`
}
