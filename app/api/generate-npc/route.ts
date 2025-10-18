import { generateText } from "ai"
import { NextResponse } from "next/server"
import { getModelForTask } from "@/lib/ai-router"
import { buildGenerationContext, formatContextForPrompt } from "@/lib/ai/context-builder"
import { getCachedAIGeneration, cacheAIGeneration } from "@/lib/cache/patterns"
import { CacheTiers, generateHash } from "@/lib/cache/strategy"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { prompt, archetype, model: customModel, zoneId, relatedNpcIds } = body

    // Input validation
    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      return NextResponse.json(
        { error: "Invalid input: 'prompt' must be a non-empty string" },
        { status: 400 }
      )
    }

    if (!archetype || typeof archetype !== "string" || archetype.trim() === "") {
      return NextResponse.json(
        { error: "Invalid input: 'archetype' must be a non-empty string" },
        { status: 400 }
      )
    }

    if (customModel !== undefined && typeof customModel !== "string") {
      return NextResponse.json(
        { error: "Invalid input: 'model' must be a string if provided" },
        { status: 400 }
      )
    }

    if (zoneId !== undefined && typeof zoneId !== "string" && typeof zoneId !== "number") {
      return NextResponse.json(
        { error: "Invalid input: 'zoneId' must be a string or number if provided" },
        { status: 400 }
      )
    }

    if (relatedNpcIds !== undefined && !Array.isArray(relatedNpcIds)) {
      return NextResponse.json(
        { error: "Invalid input: 'relatedNpcIds' must be an array if provided" },
        { status: 400 }
      )
    }

    const context = await buildGenerationContext({
      zoneId,
      relatedNpcIds,
      includeRelationships: true,
    })

    const contextPrompt = formatContextForPrompt(context)

    const cacheKey = CacheTiers.AI_NPC(archetype, generateHash({ prompt, archetype, zoneId }))
    const cached = await getCachedAIGeneration(cacheKey)
    if (cached) {
      console.log("[v0] Returning cached NPC generation")
      return NextResponse.json(cached)
    }

    const selectedModel = getModelForTask("npc_dialogue", customModel, "cost")

    let text: string
    try {
      const result = await generateText({
        model: selectedModel,
        prompt: `Generate a detailed NPC script for a Runescape-like MMORPG.

${contextPrompt}

REQUIREMENTS:
- Archetype: ${archetype}
- Additional Context: ${prompt}
${context.zone ? `- Must fit naturally into ${context.zone.name} (${context.zone.type}, danger level ${context.zone.dangerLevel}/10)` : ""}
${context.zone?.existingNpcs.length ? `- Should have unique personality compared to existing NPCs: ${context.zone.existingNpcs.join(", ")}` : ""}
${context.lore ? `- Should reference or align with existing lore themes` : ""}

Generate a JSON object with the following structure:
{
  "personality": {
    "name": "NPC Name",
    "archetype": "${archetype}",
    "traits": ["trait1", "trait2"],
    "goals": ["goal1", "goal2"],
    "fears": ["fear1", "fear2"],
    "moralAlignment": "alignment"
  },
  "dialogues": [
    {
      "id": "greeting",
      "text": "Greeting dialogue",
      "responses": [{"text": "Response option", "nextNodeId": "next"}]
    }
  ],
  "quests": [
    {
      "id": "quest_id",
      "title": "Quest Title",
      "description": "Quest description",
      "objectives": ["objective1"],
      "rewards": {"gold": 100, "items": []}
    }
  ],
  "behavior": {
    "id": "behavior_id",
    "name": "Behavior Name",
    "schedule": [{"time": "morning", "action": "open_shop", "location": "market"}],
    "reactions": [{"trigger": "player_greeting", "action": "greet_back"}],
    "relationships": []
  }
}

Return ONLY valid JSON, no markdown or explanation.`,
      })
      text = result.text
    } catch (error) {
      console.error("AI generation error:", error)
      return NextResponse.json(
        { error: "Failed to generate NPC from AI service" },
        { status: 500 }
      )
    }

    let npcData
    try {
      npcData = JSON.parse(text)
    } catch (error) {
      console.error("JSON parse error - AI returned invalid JSON:", { text, error })
      return NextResponse.json(
        { error: "Invalid AI response: could not parse JSON" },
        { status: 502 }
      )
    }

    const npcScript = {
      id: `npc_${Date.now()}`,
      version: "1.0.0",
      createdAt: new Date().toISOString(),
      ...npcData,
      zoneId: zoneId || null,
      elizaOSConfig: {
        agentId: `agent_${Date.now()}`,
        memoryEnabled: true,
        autonomyLevel: "medium",
        decisionMakingModel: selectedModel,
      },
      metadata: {
        tags: [archetype],
        author: "AI Generator",
        testStatus: "draft",
        generatedWithContext: !!contextPrompt,
      },
    }

    await cacheAIGeneration(cacheKey, npcScript)

    return NextResponse.json(npcScript)
  } catch (error) {
    console.error("NPC generation error:", error)
    return NextResponse.json({ error: "Failed to generate NPC script" }, { status: 500 })
  }
}
