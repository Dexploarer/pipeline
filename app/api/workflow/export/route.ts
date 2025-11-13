import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { exportConfig, workflowResults } = body

    if (!exportConfig?.formats || exportConfig.formats.length === 0) {
      return NextResponse.json({ error: 'Export formats are required' }, { status: 400 })
    }

    const exports: Record<string, any> = {}

    for (const format of exportConfig.formats) {
      switch (format) {
        case 'unity':
          exports.unity = formatForUnity(workflowResults)
          break
        case 'unreal':
          exports.unreal = formatForUnreal(workflowResults)
          break
        case 'godot':
          exports.godot = formatForGodot(workflowResults)
          break
        case 'elizaos':
          exports.elizaos = formatForElizaOS(workflowResults)
          break
        case 'json':
          exports.json = workflowResults
          break
        default:
          console.warn(`Unknown export format: ${format}`)
      }
    }

    return NextResponse.json({
      success: true,
      exports,
      formats: exportConfig.formats,
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

function formatForUnity(data: any) {
  return {
    npcName: data.name || 'Unknown NPC',
    personality: data.personality || '',
    dialoguePatterns: data.dialoguePatterns || [],
    voiceConfig: data.voice ? {
      voiceId: data.voice.voiceId,
      agentId: data.voice.agent?.agentId,
    } : null,
    metadata: {
      generatedAt: new Date().toISOString(),
      format: 'unity',
    },
  }
}

function formatForUnreal(data: any) {
  return {
    NPCData: {
      DisplayName: data.name || 'Unknown NPC',
      PersonalityTraits: data.personality || '',
      DialogueOptions: data.dialoguePatterns || [],
      VoiceSettings: data.voice || null,
    },
    Metadata: {
      ExportedAt: new Date().toISOString(),
      Format: 'Unreal',
    },
  }
}

function formatForGodot(data: any) {
  return {
    npc_name: data.name || 'Unknown NPC',
    personality: data.personality || '',
    dialogue_patterns: data.dialoguePatterns || [],
    voice_config: data.voice || null,
    _metadata: {
      generated_at: new Date().toISOString(),
      format: 'godot',
    },
  }
}

function formatForElizaOS(data: any) {
  return {
    name: data.name || 'Unknown NPC',
    description: data.personality || '',
    system: `You are ${data.name}. ${data.personality}`,
    bio: data.backstory || [],
    lore: data.lore || [],
    messageExamples: (data.dialoguePatterns || []).map((pattern: string) => ({
      user: '{{user1}}',
      content: { text: pattern },
    })),
    topics: [],
    style: {
      all: ['immersive', 'character-driven'],
      chat: ['responsive', 'engaging'],
      post: ['descriptive'],
    },
    adjectives: ['unique', 'memorable', 'engaging'],
    voice: data.voice ? {
      model: 'elevenlabs',
      voiceId: data.voice.voiceId,
      agentId: data.voice.agent?.agentId,
    } : null,
  }
}
