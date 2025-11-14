import { generateText } from "ai"
import { NextResponse } from "next/server"
import { getModelForTask } from "@/lib/ai-router"
import { buildGenerationContext, formatContextForPrompt } from "@/lib/ai/context-builder"
import { getCachedAIGeneration, cacheAIGeneration } from "@/lib/cache/patterns"
import { CacheTiers, generateHash } from "@/lib/cache/strategy"
import {
  makeNPCPersonalityPrompt,
  parseNPCPersonalityResponse,
  makeNPCQuestPrompt,
  parseNPCQuestResponse,
  makeNPCDialoguePrompt,
  parseNPCDialogueResponse,
  makeNPCRelationshipPrompt,
  parseNPCRelationshipResponse,
  makeNPCBehaviorPrompt,
  parseNPCBehaviorResponse,
} from "@/lib/ai/npc-prompts"

export const runtime = "nodejs"
export const maxDuration = 60 // Allow up to 60 seconds for 5-stage generation

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

    // Check cache first
    const sortedRelatedNpcIds = relatedNpcIds ? [...relatedNpcIds].sort() : []
    const cacheKey = CacheTiers.AI_NPC(
      archetype,
      generateHash({ prompt, archetype, zoneId, relatedNpcIds: sortedRelatedNpcIds, version: "v2" })
    )
    const cached = await getCachedAIGeneration(cacheKey)
    if (cached) {
      console.log("[NPC-V2] Returning cached NPC generation")
      return NextResponse.json({ ...cached, cached: true })
    }

    // Build world context
    const context = await buildGenerationContext({
      zoneId: zoneId !== undefined ? String(zoneId) : undefined,
      relatedNpcIds: relatedNpcIds?.map(String),
      includeRelationships: true,
    })

    const contextPrompt = formatContextForPrompt(context)
    const selectedModel = getModelForTask("npc_dialogue", customModel, "cost")

    console.log("[NPC-V2] Starting 5-stage NPC generation...")

    // ===== STAGE 1: PERSONALITY & BACKSTORY =====
    console.log("[NPC-V2] Stage 1: Generating personality...")
    let personalityResult
    try {
      const result = await generateText({
        model: selectedModel,
        prompt: makeNPCPersonalityPrompt(archetype, prompt, contextPrompt),
        temperature: 0.8,
      })
      personalityResult = parseNPCPersonalityResponse(result.text)
      console.log("[NPC-V2] Stage 1 complete:", personalityResult.name)
    } catch (error) {
      console.error("[NPC-V2] Stage 1 failed:", error)
      return NextResponse.json(
        { error: "Failed to generate NPC personality", stage: 1 },
        { status: 500 }
      )
    }

    // ===== STAGE 2: QUEST GENERATION =====
    console.log("[NPC-V2] Stage 2: Generating quest...")
    let questResult
    try {
      const result = await generateText({
        model: selectedModel,
        prompt: makeNPCQuestPrompt(
          personalityResult.name,
          personalityResult.archetype,
          personalityResult.backstory
        ),
        temperature: 0.7,
      })
      questResult = parseNPCQuestResponse(result.text)
      console.log("[NPC-V2] Stage 2 complete:", questResult.title)
    } catch (error) {
      console.error("[NPC-V2] Stage 2 failed:", error)
      return NextResponse.json(
        { error: "Failed to generate NPC quest", stage: 2 },
        { status: 500 }
      )
    }

    // ===== STAGE 3: DIALOGUE TREE =====
    console.log("[NPC-V2] Stage 3: Generating dialogue...")
    const dialogues = []
    try {
      // Generate greeting dialogue
      const greetingResult = await generateText({
        model: selectedModel,
        prompt: makeNPCDialoguePrompt(
          personalityResult.name,
          personalityResult.traits.join(", "),
          personalityResult.backstory
        ),
        temperature: 0.7,
      })
      const greetingDialogue = parseNPCDialogueResponse(greetingResult.text)
      dialogues.push(greetingDialogue)

      // Generate quest offer dialogue
      const questOfferResult = await generateText({
        model: selectedModel,
        prompt: makeNPCDialoguePrompt(
          personalityResult.name,
          `Offering quest: ${questResult.title}`,
          personalityResult.backstory
        ),
        temperature: 0.7,
      })
      const questOfferDialogue = parseNPCDialogueResponse(questOfferResult.text)
      dialogues.push({...questOfferDialogue, id: "quest_offer"})

      console.log("[NPC-V2] Stage 3 complete: Generated", dialogues.length, "dialogue nodes")
    } catch (error) {
      console.error("[NPC-V2] Stage 3 failed:", error)
      return NextResponse.json(
        { error: "Failed to generate NPC dialogues", stage: 3 },
        { status: 500 }
      )
    }

    // ===== STAGE 4: RELATIONSHIPS =====
    console.log("[NPC-V2] Stage 4: Generating relationships...")
    let relationships: any[] = []
    try {
      const contextNPCs = context.npcs?.map((npc) => `"${npc.name}" (${npc.archetype})`) || []
      const result = await generateText({
        model: selectedModel,
        prompt: makeNPCRelationshipPrompt(
          personalityResult.name,
          personalityResult.archetype,
          personalityResult.backstory,
          contextNPCs
        ),
        temperature: 0.7,
      })
      console.log("[NPC-V2] Stage 4 raw response:", result.text.substring(0, 200))
      relationships = parseNPCRelationshipResponse(result.text)
      console.log("[NPC-V2] Stage 4 complete: Generated", relationships.length, "relationships")
    } catch (error) {
      console.error("[NPC-V2] Stage 4 failed:", error)
      // Non-critical, continue with empty relationships
      relationships = []
    }

    // ===== STAGE 5: BEHAVIOR =====
    console.log("[NPC-V2] Stage 5: Generating behavior...")
    let behaviorResult
    try {
      const result = await generateText({
        model: selectedModel,
        prompt: makeNPCBehaviorPrompt(
          personalityResult.name,
          personalityResult.archetype,
          personalityResult.traits.join(", ")
        ),
        temperature: 0.7,
      })
      console.log("[NPC-V2] Stage 5 raw response:", result.text.substring(0, 200))
      behaviorResult = parseNPCBehaviorResponse(result.text)
      console.log("[NPC-V2] Stage 5 complete:", behaviorResult.schedule.length, "schedule entries,", behaviorResult.reactions.length, "reactions")
    } catch (error) {
      console.error("[NPC-V2] Stage 5 failed:", error)
      // Provide fallback behavior
      behaviorResult = {
        schedule: [
          { time: "08:00", location: "main_square", activity: "idle" },
          { time: "12:00", location: "main_square", activity: "trading" },
          { time: "18:00", location: "home", activity: "resting" }
        ],
        reactions: [
          { trigger: "player_greeting", response: "greet_back", priority: 1 }
        ]
      }
    }

    // ===== ASSEMBLE COMPLETE NPC =====
    const npcScript = {
      id: `npc_${Date.now()}`,
      version: "2.0.0",
      createdAt: new Date().toISOString(),
      personality: {
        name: personalityResult.name,
        archetype: personalityResult.archetype,
        traits: personalityResult.traits,
        goals: personalityResult.goals,
        fears: personalityResult.fears,
        moralAlignment: personalityResult.moralAlignment,
      },
      backstory: personalityResult.backstory,
      dialogueStyle: `${personalityResult.traits.slice(0, 2).join(", ")} speaker`,
      dialogues,
      quests: [
        {
          id: `quest_${Date.now()}`,
          ...questResult,
          questGiver: personalityResult.name,
        },
      ],
      behavior: {
        id: `behavior_${Date.now()}`,
        name: `${personalityResult.name}'s Routine`,
        schedule: behaviorResult.schedule,
        reactions: behaviorResult.reactions,
        relationships,
      },
      zoneId: zoneId || null,
      elizaOSConfig: {
        agentId: `agent_${Date.now()}`,
        memoryEnabled: true,
        autonomyLevel: "medium" as const,
        decisionMakingModel: typeof selectedModel === "string" ? selectedModel : "gpt-4o-mini",
      },
      metadata: {
        tags: [archetype, ...personalityResult.traits.slice(0, 3)],
        author: "AI Generator V2",
        testStatus: "draft" as const,
        generatedWithContext: !!contextPrompt,
        generationMethod: "5-stage-few-shot",
      },
    }

    // Cache the result
    await cacheAIGeneration(cacheKey, npcScript)

    console.log("[NPC-V2] ✅ Complete 5-stage generation successful!")

    return NextResponse.json({ ...npcScript, cached: false })
  } catch (error) {
    console.error("[NPC-V2] Fatal error:", error)
    return NextResponse.json({ error: "Failed to generate NPC script" }, { status: 500 })
  }
}
