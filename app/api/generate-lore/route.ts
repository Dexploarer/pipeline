import { generateText } from "ai"
import { getModelForTask } from "@/lib/ai-router"
import { buildGenerationContext, formatContextForPrompt } from "@/lib/ai/context-builder"
import { getCachedAIGeneration, cacheAIGeneration } from "@/lib/cache/patterns"
import { CacheTiers, generateHash } from "@/lib/cache/strategy"

export async function POST(req: Request) {
  try {
    const { prompt, category, existingLore, model: customModel, zoneId } = await req.json()

    const context = await buildGenerationContext({
      zoneId,
    })

    const contextPrompt = formatContextForPrompt(context)

    const cacheKey = CacheTiers.AI_LORE(category, generateHash({ prompt, category, zoneId }))
    const cached = await getCachedAIGeneration(cacheKey)
    if (cached) {
      console.log("[v0] Returning cached lore generation")
      return Response.json(cached)
    }

    const selectedModel = getModelForTask("lore_writing", customModel, "quality")

    const { text } = await generateText({
      model: selectedModel,
      prompt: `Generate detailed lore content for: "${prompt}"

Category: ${category}

${contextPrompt}

REQUIREMENTS:
${context.zone ? `- Lore should fit ${context.zone.name} (${context.zone.type}, danger level ${context.zone.dangerLevel}/10)` : ""}
${context.zone?.lore.length ? `- Should connect to existing lore: ${context.zone.lore.join(", ")}` : ""}
${context.npcs?.length ? `- Can reference these NPCs: ${context.npcs.map((n) => n.name).join(", ")}` : ""}

Existing lore context:
${existingLore.map((e: any) => `- ${e.title}: ${e.content.substring(0, 100)}...`).join("\n")}

Create rich, interconnected lore that fits the existing world. Include:
- Detailed description (200-300 words)
- Relevant tags (5-7 tags)
- Connections to existing lore

Return as JSON with format:
{
  "content": "detailed lore text",
  "tags": ["tag1", "tag2", ...]
}`,
      temperature: 0.8,
    })

    const result = JSON.parse(text)

    await cacheAIGeneration(cacheKey, result)

    return Response.json(result)
  } catch (error) {
    console.error("Lore generation error:", error)
    return Response.json(
      {
        content: "Failed to generate lore. Please try again.",
        tags: [],
      },
      { status: 500 },
    )
  }
}
