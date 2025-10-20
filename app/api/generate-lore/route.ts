import { generateText } from "ai"
import { getModelForTask } from "@/lib/ai-router"
import { buildGenerationContext, formatContextForPrompt } from "@/lib/ai/context-builder"
import { getCachedAIGeneration, cacheAIGeneration } from "@/lib/cache/patterns"
import { CacheTiers, generateHash } from "@/lib/cache/strategy"
import { z } from "zod"

// Request validation schema
const requestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  category: z.string(),
  existingLore: z.array(z.any()).default([]),
  model: z.string().optional(),
  zoneId: z.union([z.string(), z.number()]).optional(),
})

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const RATE_LIMIT_MAX = 10 // 10 requests per minute

function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false
  }

  record.count++
  return true
}

export async function POST(req: Request) {
  try {
    // TODO: Add authentication check here
    // const session = await getSession(req)
    // if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

    // Rate limiting
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    if (!checkRateLimit(ip)) {
      return Response.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 })
    }

    // Validate request body
    const body = await req.json()
    const validationResult = requestSchema.safeParse(body)

    if (!validationResult.success) {
      return Response.json(
        { error: "Invalid request", details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { prompt, category, existingLore, model: customModel, zoneId } = validationResult.data

    const context = await buildGenerationContext({
      zoneId: zoneId !== undefined ? String(zoneId) : undefined,
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
${Array.isArray(existingLore) && existingLore.length > 0
  ? existingLore
      .map((e: any) => {
        const title = e?.title || "Untitled"
        const content = typeof e?.content === "string" ? e.content.substring(0, 100) : ""
        return `- ${title}: ${content}${content ? "..." : ""}`
      })
      .join("\n")
  : "No existing lore"
}

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
