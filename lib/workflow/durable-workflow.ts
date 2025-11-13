import { serve, waitSeconds, waitMinutes } from '@upstash/workflow'
import type { WorkflowContext, NodeExecutionResult } from './types'

/**
 * Durable workflow powered by Upstash Workflow DevKit
 * Handles long-running NPC generation pipelines with automatic retries and state persistence
 */

interface NPCGenerationInput {
  prompt: string
  archetype?: string
  model?: string
  voiceConfig?: {
    voiceId?: string
    stability?: number
    similarityBoost?: number
  }
  exportFormats?: string[]
}

interface NPCGenerationOutput {
  npc: {
    id: string
    name: string
    personality: string
    backstory: string
    dialoguePatterns: string[]
    relationships: Array<{ npcId: string; relationship: string }>
  }
  voice?: {
    voiceId: string
    previewUrl?: string
  }
  exports?: Record<string, string>
}

/**
 * Main durable workflow for NPC generation
 * This workflow can pause, resume, and survive deployments
 */
export const npcGenerationWorkflow = serve<NPCGenerationInput>(
  async (context) => {
    const { prompt, archetype, model = 'claude-sonnet-4-5', voiceConfig, exportFormats } = context.requestPayload

    console.log('🚀 Starting durable NPC generation workflow', {
      workflowRunId: context.workflowRunId,
      prompt,
      archetype,
    })

    // Step 1: Generate NPC Personality (AI Generation)
    const personality = await context.run('generate-personality', async () => {
      console.log('🎭 Generating NPC personality...')

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/generate-npc-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          archetype,
          model,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate personality: ${response.statusText}`)
      }

      return response.json()
    })

    // Wait a bit for rate limiting
    await waitSeconds('rate-limit-pause-1', 2)

    // Step 2: Generate Quest Hooks
    const questHooks = await context.run('generate-quest-hooks', async () => {
      console.log('🎯 Generating quest hooks...')

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/generate-quest-layer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          npcName: personality.name,
          npcPersonality: personality.personality,
          layer: 'game_flow',
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate quest hooks: ${response.statusText}`)
      }

      return response.json()
    })

    await waitSeconds('rate-limit-pause-2', 2)

    // Step 3: Generate Dialogue Patterns
    const dialoguePatterns = await context.run('generate-dialogue', async () => {
      console.log('💬 Generating dialogue patterns...')

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/generate-dialogue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          npcName: personality.name,
          personality: personality.personality,
          context: personality.backstory,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate dialogue: ${response.statusText}`)
      }

      return response.json()
    })

    await waitSeconds('rate-limit-pause-3', 2)

    // Step 4: Configure Voice (ElevenLabs)
    let voiceResult
    if (voiceConfig) {
      voiceResult = await context.run('configure-voice', async () => {
        console.log('🎤 Configuring ElevenLabs voice...')

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/workflow/voice-config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            voiceConfig,
            npcData: {
              name: personality.name,
              personality: personality.personality,
              backstory: personality.backstory,
            },
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to configure voice: ${response.statusText}`)
        }

        return response.json()
      })

      await waitSeconds('rate-limit-pause-4', 2)
    }

    // Step 5: Export to formats
    let exportResults
    if (exportFormats && exportFormats.length > 0) {
      exportResults = await context.run('export-npc', async () => {
        console.log('📦 Exporting NPC to formats:', exportFormats)

        const npcData = {
          ...personality,
          questHooks,
          dialoguePatterns,
          voice: voiceResult,
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/workflow/export`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exportConfig: {
              formats: exportFormats,
              includeVoice: !!voiceResult,
            },
            workflowResults: npcData,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to export NPC: ${response.statusText}`)
        }

        return response.json()
      })
    }

    // Step 6: Store results in database
    await context.run('store-results', async () => {
      console.log('💾 Storing workflow results...')

      // Store the complete NPC package
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/workflow/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowRunId: context.workflowRunId,
          npcData: {
            ...personality,
            questHooks,
            dialoguePatterns,
            voice: voiceResult,
            exports: exportResults,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to store results: ${response.statusText}`)
      }

      return response.json()
    })

    console.log('✅ Durable workflow completed successfully', {
      workflowRunId: context.workflowRunId,
      npcName: personality.name,
    })

    // Return the complete NPC package
    return {
      success: true,
      workflowRunId: context.workflowRunId,
      npc: {
        id: personality.id,
        name: personality.name,
        personality: personality.personality,
        backstory: personality.backstory,
        dialoguePatterns: dialoguePatterns.patterns || [],
        relationships: personality.relationships || [],
      },
      voice: voiceResult,
      exports: exportResults,
    }
  },
  {
    // Workflow configuration
    failureFunction: async ({ context, failStatus, failResponse }) => {
      console.error('❌ Workflow failed', {
        workflowRunId: context.workflowRunId,
        status: failStatus,
        error: failResponse,
      })

      // Log failure to monitoring system
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/workflow/failure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowRunId: context.workflowRunId,
          status: failStatus,
          error: failResponse,
        }),
      })
    },
  }
)

/**
 * Batch NPC generation workflow for processing multiple NPCs
 */
export const batchNPCGenerationWorkflow = serve<{ npcs: NPCGenerationInput[] }>(
  async (context) => {
    const { npcs } = context.requestPayload

    console.log('🚀 Starting batch NPC generation workflow', {
      workflowRunId: context.workflowRunId,
      count: npcs.length,
    })

    const results = []

    for (let i = 0; i < npcs.length; i++) {
      const npcInput = npcs[i]

      const result = await context.run(`generate-npc-${i}`, async () => {
        console.log(`📝 Generating NPC ${i + 1}/${npcs.length}`)

        // Trigger the individual NPC workflow
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/workflow/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(npcInput),
        })

        if (!response.ok) {
          throw new Error(`Failed to generate NPC ${i + 1}: ${response.statusText}`)
        }

        return response.json()
      })

      results.push(result)

      // Wait between batch items to avoid rate limits
      if (i < npcs.length - 1) {
        await waitSeconds(`batch-pause-${i}`, 5)
      }
    }

    console.log('✅ Batch workflow completed', {
      workflowRunId: context.workflowRunId,
      successCount: results.filter((r) => r.success).length,
      totalCount: npcs.length,
    })

    return {
      success: true,
      workflowRunId: context.workflowRunId,
      results,
      summary: {
        total: npcs.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
    }
  }
)
