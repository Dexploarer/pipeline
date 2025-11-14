import { NextRequest, NextResponse } from 'next/server'
import { getElevenLabsClient } from '@/lib/elevenlabs/client'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { voiceConfig, npcData } = body

    if (!voiceConfig) {
      return NextResponse.json({ error: 'Voice config is required' }, { status: 400 })
    }

    if (!npcData?.name || !npcData?.personality) {
      return NextResponse.json({ error: 'NPC data (name, personality) is required' }, { status: 400 })
    }

    // Initialize ElevenLabs client
    const client = getElevenLabsClient()

    // Get available voices if no voice ID specified
    let selectedVoiceId = voiceConfig.voiceId
    if (!selectedVoiceId) {
      const voices = await client.getVoices()
      // Select a random voice or first available
      selectedVoiceId = voices.voices?.[0]?.voice_id
    }

    if (!selectedVoiceId) {
      return NextResponse.json({ error: 'No voice ID available' }, { status: 400 })
    }

    // Generate a voice preview with sample dialogue
    const sampleDialogue = `Greetings, traveler. I am ${npcData.name}. ${npcData.personality.slice(0, 100)}...`

    const preview = await client.generateNPCVoicePreview(
      npcData.name,
      sampleDialogue,
      selectedVoiceId,
      voiceConfig
    )

    // Note: For conversational AI agents, use the /api/agents endpoints instead
    // NPCs only get voice generation, not conversational streaming

    return NextResponse.json({
      success: true,
      voiceId: selectedVoiceId,
      voiceConfig,
      preview: {
        sampleText: preview.sampleText,
        // Note: In production, you'd upload the audio buffer to storage and return a URL
        audioAvailable: true,
      },
      message: 'Voice configuration created. NPCs use static voice generation only. For conversational AI, create game-playing agents at /agents.',
    })
  } catch (error) {
    console.error('Voice configuration error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
