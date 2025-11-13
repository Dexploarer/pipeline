import type { VoiceConfig } from '../workflow/types'

/**
 * ElevenLabs API client for voice generation and agent management
 */
export class ElevenLabsClient {
  private apiKey: string
  private baseUrl = 'https://api.elevenlabs.io/v1'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ELEVENLABS_API_KEY || ''
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key is required')
    }
  }

  /**
   * Get all available voices
   */
  async getVoices() {
    const response = await fetch(`${this.baseUrl}/voices`, {
      headers: {
        'xi-api-key': this.apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Generate speech from text
   */
  async generateSpeech(text: string, voiceId: string, config?: VoiceConfig) {
    const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: config?.model || 'eleven_multilingual_v2',
        voice_settings: {
          stability: config?.stability ?? 0.5,
          similarity_boost: config?.similarityBoost ?? 0.75,
          style: config?.style ?? 0,
          use_speaker_boost: config?.useSpeakerBoost ?? true,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to generate speech: ${response.statusText}`)
    }

    return response.arrayBuffer()
  }

  /**
   * Create a conversational AI agent
   */
  async createAgent(config: {
    name: string
    prompt: string
    voiceId: string
    firstMessage?: string
    model?: string
  }) {
    const response = await fetch(`${this.baseUrl}/convai/agents`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: config.name,
        conversation_config: {
          agent: {
            prompt: {
              prompt: config.prompt,
            },
            first_message: config.firstMessage || 'Hello! How can I help you today?',
            language: 'en',
          },
          tts: {
            voice_id: config.voiceId,
            model_id: config.model || 'eleven_turbo_v2_5',
          },
          llm: {
            model_id: 'claude-sonnet-4-5',
          },
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to create agent: ${response.statusText} - ${error}`)
    }

    return response.json()
  }

  /**
   * Update an existing agent
   */
  async updateAgent(agentId: string, updates: Partial<{
    name: string
    prompt: string
    voiceId: string
    firstMessage: string
  }>) {
    const response = await fetch(`${this.baseUrl}/convai/agents/${agentId}`, {
      method: 'PATCH',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: updates.name,
        conversation_config: updates.prompt || updates.voiceId || updates.firstMessage ? {
          agent: updates.prompt || updates.firstMessage ? {
            prompt: updates.prompt ? { prompt: updates.prompt } : undefined,
            first_message: updates.firstMessage,
          } : undefined,
          tts: updates.voiceId ? {
            voice_id: updates.voiceId,
          } : undefined,
        } : undefined,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to update agent: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get agent by ID
   */
  async getAgent(agentId: string) {
    const response = await fetch(`${this.baseUrl}/convai/agents/${agentId}`, {
      headers: {
        'xi-api-key': this.apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch agent: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * List all agents
   */
  async listAgents() {
    const response = await fetch(`${this.baseUrl}/convai/agents`, {
      headers: {
        'xi-api-key': this.apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to list agents: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Delete an agent
   */
  async deleteAgent(agentId: string) {
    const response = await fetch(`${this.baseUrl}/convai/agents/${agentId}`, {
      method: 'DELETE',
      headers: {
        'xi-api-key': this.apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to delete agent: ${response.statusText}`)
    }

    return { success: true }
  }

  /**
   * Generate a voice preview for NPC dialogue
   */
  async generateNPCVoicePreview(
    npcName: string,
    sampleDialogue: string,
    voiceId: string,
    config?: VoiceConfig
  ) {
    const text = `${npcName}: ${sampleDialogue}`
    const audio = await this.generateSpeech(text, voiceId, config)

    return {
      npcName,
      voiceId,
      audioBuffer: audio,
      sampleText: text,
      config,
    }
  }

  /**
   * Create a conversational agent for an NPC
   */
  async createNPCAgent(npcData: {
    name: string
    personality: string
    backstory: string
    dialogueStyle: string
    voiceId: string
    greetingMessage?: string
  }) {
    const prompt = this.buildNPCPrompt(npcData)

    return this.createAgent({
      name: npcData.name,
      prompt,
      voiceId: npcData.voiceId,
      firstMessage: npcData.greetingMessage || `Greetings, traveler. I am ${npcData.name}.`,
      model: 'eleven_turbo_v2_5',
    })
  }

  /**
   * Build a comprehensive prompt for an NPC agent
   */
  private buildNPCPrompt(npcData: {
    name: string
    personality: string
    backstory: string
    dialogueStyle: string
  }): string {
    return `You are ${npcData.name}, a character in a game world.

PERSONALITY:
${npcData.personality}

BACKSTORY:
${npcData.backstory}

DIALOGUE STYLE:
${npcData.dialogueStyle}

INSTRUCTIONS:
- Stay in character as ${npcData.name} at all times
- Respond naturally based on your personality and backstory
- Keep responses concise and engaging (2-3 sentences typically)
- Use dialogue that fits the game world's tone
- React appropriately to the player's actions and questions
- Remember previous conversation context
- Show personality through your word choices and tone

Remember: You are a living, breathing character in a game world. Make the player feel immersed in the experience.`
  }
}

/**
 * Singleton instance for server-side use
 */
let clientInstance: ElevenLabsClient | null = null

export function getElevenLabsClient(): ElevenLabsClient {
  if (!clientInstance) {
    clientInstance = new ElevenLabsClient()
  }
  return clientInstance
}
