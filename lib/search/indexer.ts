import { npcIndex } from "./indexes"
import { generateEmbedding } from "./embeddings"
import type { NPC } from "../npc-types"

// Index an NPC for search
export async function indexNPC(npc: NPC): Promise<void> {
  try {
    // Create searchable text from NPC data
    const personalityTraits =
      Array.isArray((npc.personality as Record<string, unknown>)["traits"])
        ? ((npc.personality as Record<string, unknown>)["traits"] as string[]).join(" ")
        : ""

    const searchableText = `
      ${npc.name}
      ${npc.archetype}
      ${personalityTraits}
      ${npc.backstory ?? ""}
      ${npc.goals?.join(" ") ?? ""}
    `.trim()

    // Generate embedding
    const embedding = await generateEmbedding(searchableText)

    // Upsert to index with metadata
    await npcIndex.upsert({
      id: npc.id,
      vector: embedding,
      metadata: {
        name: npc.name,
        archetype: npc.archetype,
        zoneId: npc.zoneId ?? "",
        createdAt: new Date().toISOString(),
      },
    })

    console.log(`[v0] Indexed NPC: ${npc.name}`)
  } catch (error) {
    console.error("[v0] Failed to index NPC:", error)
    throw error
  }
}

// Index multiple NPCs in batch
export async function indexNPCsBatch(npcs: NPC[]): Promise<void> {
  for (const npc of npcs) {
    try {
      await indexNPC(npc)
      // Rate limiting delay
      await new Promise((resolve) => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`[v0] Failed to index NPC ${npc.id}:`, error)
    }
  }
}

// Remove NPC from index
export async function removeNPCFromIndex(npcId: string): Promise<void> {
  try {
    await npcIndex.delete(npcId)
    console.log(`[v0] Removed NPC from index: ${npcId}`)
  } catch (error) {
    console.error("[v0] Failed to remove NPC from index:", error)
  }
}

// Update NPC in index
export async function updateNPCInIndex(npc: NPC): Promise<void> {
  await indexNPC(npc) // Upsert handles updates
}
