import * as zoneRepo from "../db/repositories/zones"
import * as npcRepo from "../db/repositories/npcs"
import * as questRepo from "../db/repositories/quests"
import * as loreRepo from "../db/repositories/lore"
import * as relationshipRepo from "../db/repositories/relationships"

export interface GenerationContextNPC {
  name: string
  archetype: string
  personality: Record<string, unknown>
  backstory?: string
}

export interface GenerationContextRelationship {
  from: string
  to: string
  type: string
  strength: number
  description?: string
}

export interface GenerationContextQuest {
  title: string
  type: string
  objectives: Array<Record<string, unknown>>
  difficulty?: string
}

export interface GenerationContextLore {
  title: string
  category: string
  content: string
}

export interface GenerationContextZone {
  name: string
  type: string
  dangerLevel: number
  existingNpcs: string[]
  existingQuests: string[]
  lore: string[]
  description?: string
}

export interface GenerationContext {
  zone?: GenerationContextZone
  npcs?: GenerationContextNPC[]
  relationships?: GenerationContextRelationship[]
  quest?: GenerationContextQuest
  lore?: GenerationContextLore[]
}

// Build comprehensive context for AI generation
export async function buildGenerationContext(params: {
  zoneId?: string
  relatedNpcIds?: string[]
  questId?: string
  includeRelationships?: boolean
}): Promise<GenerationContext> {
  const context: GenerationContext = {}

  // Zone context
  if (params.zoneId !== undefined) {
    const zone = await zoneRepo.getZone(params.zoneId)
    if (zone !== null) {
      const zoneNpcs = await npcRepo.getNPCsByZone(params.zoneId)
      const zoneQuests = await questRepo.getQuestsByZone(params.zoneId)
      const zoneLore = await loreRepo.getLoreByZone(params.zoneId)

      context.zone = {
        name: zone.name,
        type: zone.type,
        dangerLevel: zone.dangerLevel,
        description: zone.description,
        existingNpcs: zoneNpcs.map((n) => n.name),
        existingQuests: zoneQuests.map((q) => q.title),
        lore: zoneLore.map((l) => l.title),
      }
    }
  }

  // NPC context
  if (params.relatedNpcIds !== undefined && params.relatedNpcIds.length > 0) {
    const npcs = await Promise.all(params.relatedNpcIds.map((id) => npcRepo.getNPC(id)))
    context.npcs = npcs
      .filter((npc): npc is NonNullable<typeof npc> => npc !== null)
      .map((npc) => ({
        name: npc.name,
        archetype: npc.archetype,
        personality: npc.personality,
        backstory: npc.backstory,
      }))

    // Relationships
    if (params.includeRelationships === true) {
      const allRelationships = await Promise.all(
        params.relatedNpcIds.map((id) => relationshipRepo.getRelationshipsForEntity(id)),
      )
      context.relationships = allRelationships.flat().map((r) => ({
        from: r.entityAId,
        to: r.entityBId,
        type: r.relationshipType,
        strength: r.strength,
        description: r.description,
      }))
    }
  }

  // Quest context
  if (params.questId !== undefined) {
    const quest = await questRepo.getQuest(params.questId)
    if (quest !== null) {
      context.quest = {
        title: quest.title,
        type: quest.questType,
        objectives: (quest.objectives ?? []) as unknown as Array<Record<string, unknown>>,
        difficulty: quest.difficulty,
      }
    }
  }

  return context
}

// Format context for AI prompt
export function formatContextForPrompt(context: GenerationContext): string {
  let prompt = ""

  if (context.zone !== undefined) {
    prompt += `ZONE CONTEXT:\n`
    prompt += `- Name: ${context.zone.name}\n`
    prompt += `- Type: ${context.zone.type}\n`
    prompt += `- Danger Level: ${context.zone.dangerLevel}/10\n`
    if (context.zone.description !== undefined) {
      prompt += `- Description: ${context.zone.description}\n`
    }
    if (context.zone.existingNpcs.length > 0) {
      prompt += `- Existing NPCs: ${context.zone.existingNpcs.join(", ")}\n`
    }
    if (context.zone.lore.length > 0) {
      prompt += `- Lore: ${context.zone.lore.join(", ")}\n`
    }
    prompt += `\n`
  }

  if (context.npcs !== undefined && context.npcs.length > 0) {
    prompt += `RELATED NPCs:\n`
    context.npcs.forEach((npc) => {
      prompt += `- ${npc.name} (${npc.archetype})\n`
      if (npc.backstory !== undefined) {
        prompt += `  Backstory: ${npc.backstory.slice(0, 200)}...\n`
      }
    })
    prompt += `\n`
  }

  if (context.relationships !== undefined && context.relationships.length > 0) {
    prompt += `RELATIONSHIPS:\n`
    context.relationships.forEach((rel) => {
      prompt += `- ${rel.from} → ${rel.to}: ${rel.type} (strength: ${rel.strength})\n`
    })
    prompt += `\n`
  }

  if (context.quest !== undefined) {
    prompt += `QUEST CONTEXT:\n`
    prompt += `- Title: ${context.quest.title}\n`
    prompt += `- Type: ${context.quest.type}\n`
    prompt += `- Difficulty: ${context.quest.difficulty ?? "unknown"}\n`
    prompt += `\n`
  }

  return prompt
}
