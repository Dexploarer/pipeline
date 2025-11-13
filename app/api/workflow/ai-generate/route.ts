import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'

export const runtime = 'edge'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { model, prompt, temperature = 0.7, systemPrompt, context } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Build context-aware prompt
    let fullPrompt = prompt
    if (context && Object.keys(context).length > 0) {
      fullPrompt = `Previous workflow results:\n${JSON.stringify(context, null, 2)}\n\n${prompt}`
    }

    // Generate using AI SDK
    const result = await generateText({
      model: anthropic(model || 'claude-sonnet-4-5-20250929'),
      system: systemPrompt || 'You are an expert game content creator specializing in NPC generation.',
      prompt: fullPrompt,
      temperature,
    })

    return NextResponse.json({
      success: true,
      text: result.text,
      usage: result.usage,
      model,
    })
  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
