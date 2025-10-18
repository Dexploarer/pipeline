import { generateText } from "ai"
import { getModelForTask } from "@/lib/ai-router"
import { buildGenerationContext, formatContextForPrompt } from "@/lib/ai/context-builder"
import { getCachedAIGeneration, cacheAIGeneration } from "@/lib/cache/patterns"
import { CacheTiers, generateHash } from "@/lib/cache/strategy"

export async function POST(req: Request) {
  try {
    const { questTitle, layerType, existingLayers, model: customModel, zoneId, relatedNpcIds } = await req.json()

    const context = await buildGenerationContext({
      zoneId,
      relatedNpcIds,
      includeRelationships: true,
    })

    const contextPrompt = formatContextForPrompt(context)

    const cacheKey = CacheTiers.AI_QUEST(layerType, questTitle, generateHash({ questTitle, layerType, zoneId }))
    const cached = await getCachedAIGeneration(cacheKey)
    if (cached) {
      console.log("[v0] Returning cached quest layer generation")
      return Response.json({ layer: cached })
    }

    const layerPrompts: Record<string, string> = {
      gameflow: `Generate game flow mechanics for a quest titled "${questTitle}".

${contextPrompt}

REQUIREMENTS:
${context.zone ? `- Quest takes place in ${context.zone.name} (${context.zone.type}, danger level ${context.zone.dangerLevel}/10)` : ""}
${context.npcs?.length ? `- Should involve these NPCs: ${context.npcs.map((n) => n.name).join(", ")}` : ""}
${context.zone?.existingQuests.length ? `- Should be unique compared to existing quests: ${context.zone.existingQuests.join(", ")}` : ""}

Include:
- 3-5 objectives with types (fetch, kill, escort, discover, craft, social, puzzle, stealth)
- Quest branches with conditions and outcomes
- Difficulty rating and estimated duration
- Rewards (experience, gold, items, reputation)

Return as JSON matching the GameFlowLayer type.`,

      lore: `Generate lore context for a quest titled "${questTitle}".

${contextPrompt}

Include:
- Narrative summary that fits the zone's theme
- Relevant historical events
- Involved factions and their stances
- Important artifacts
- Cultural context

Existing layers: ${JSON.stringify(existingLayers)}

Return as JSON matching the LoreLayer type.`,

      history: `Generate historical timeline for a quest titled "${questTitle}".

${contextPrompt}

Include:
- 2-4 historical events with dates, descriptions, and impact levels
- Preceding events that led to this quest
- Potential consequences
- Historical figures involved

Existing layers: ${JSON.stringify(existingLayers)}

Return as JSON matching the HistoryLayer type.`,

      relationships: `Generate relationship dynamics for a quest titled "${questTitle}".

${contextPrompt}

Include:
- 2-4 NPC relationships with roles, history, and quest involvement
${context.relationships?.length ? `- Consider existing relationships: ${context.relationships.map((r) => `${r.from} → ${r.to} (${r.type})`).join(", ")}` : ""}
- Faction dynamics and tensions
- Player reputation requirements

Existing layers: ${JSON.stringify(existingLayers)}

Return as JSON matching the RelationshipLayer type.`,

      economy: `Generate economic layer for a quest titled "${questTitle}".

${contextPrompt}

Include:
- Quest costs (gold, items, services)
- Economic impacts (market changes, trade routes)
- Economic consequences

Existing layers: ${JSON.stringify(existingLayers)}

Return as JSON matching the EconomyLayer type.`,

      "world-events": `Generate world events for a quest titled "${questTitle}".

${contextPrompt}

Include:
- Triggered events with conditions
- Environmental changes
- Global effects

Existing layers: ${JSON.stringify(existingLayers)}

Return as JSON matching the WorldEventLayer type.`,
    }

    const prompt = layerPrompts[layerType] ?? layerPrompts["gameflow"]

    if (!prompt) {
      throw new Error("Invalid layer type")
    }

    const selectedModel = getModelForTask("quest_generation", customModel, "quality")

    const { text } = await generateText({
      model: selectedModel,
      prompt,
      temperature: 0.8,
    })

    const layer = JSON.parse(text)

    await cacheAIGeneration(cacheKey, layer)

    return Response.json({ layer })
  } catch (error) {
    console.error("Quest layer generation error:", error)
    return Response.json({ error: "Failed to generate quest layer" }, { status: 500 })
  }
}
