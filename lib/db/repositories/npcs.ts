import { query, isDatabaseAvailable } from "../client"
import type { NPC } from "@/lib/npc-types"

function ensureDatabase(): void {
  if (!isDatabaseAvailable()) {
    throw new Error("Database not available. Please configure DATABASE_URL environment variable.")
  }
}

export async function createNPC(data: NPC): Promise<NPC> {
  ensureDatabase()

  const [npc] = await query<NPC>(
    `INSERT INTO npcs (name, archetype, personality, dialogue_style, backstory, goals, zone_id, spawn_locations, ai_model_used, generation_metadata, asset_urls)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      data.name,
      data.archetype,
      JSON.stringify(data.personality),
      data.dialogueStyle ?? null,
      data.backstory ?? null,
      data.goals ?? [],
      data.zoneId ?? null,
      JSON.stringify(data.spawnLocations ?? []),
      data.aiModelUsed ?? null,
      JSON.stringify(data.generationMetadata ?? {}),
      JSON.stringify(data.assetUrls ?? {}),
    ],
  )
  if (npc === undefined) {
    throw new Error("Failed to create NPC")
  }
  return npc
}

export async function getNPC(id: string): Promise<NPC | null> {
  ensureDatabase()

  const [npc] = await query<NPC>("SELECT * FROM npcs WHERE id = $1", [id])
  return npc ?? null
}

export async function getAllNPCs(): Promise<NPC[]> {
  ensureDatabase()

  return query<NPC>("SELECT * FROM npcs ORDER BY created_at DESC")
}

export async function getNPCsByZone(zoneId: string): Promise<NPC[]> {
  ensureDatabase()

  return query<NPC>("SELECT * FROM npcs WHERE zone_id = $1 ORDER BY name ASC", [zoneId])
}

export async function updateNPC(id: string, data: Partial<NPC>): Promise<NPC> {
  ensureDatabase()

  const updates: string[] = []
  const values: unknown[] = []
  let paramIndex = 1

  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex++}`)
    values.push(data.name)
  }
  if (data.archetype !== undefined) {
    updates.push(`archetype = $${paramIndex++}`)
    values.push(data.archetype)
  }
  if (data.personality !== undefined) {
    updates.push(`personality = $${paramIndex++}`)
    values.push(JSON.stringify(data.personality))
  }
  if (data.dialogueStyle !== undefined) {
    updates.push(`dialogue_style = $${paramIndex++}`)
    values.push(data.dialogueStyle)
  }
  if (data.backstory !== undefined) {
    updates.push(`backstory = $${paramIndex++}`)
    values.push(data.backstory)
  }
  if (data.goals !== undefined) {
    updates.push(`goals = $${paramIndex++}`)
    values.push(data.goals)
  }
  if (data.zoneId !== undefined) {
    updates.push(`zone_id = $${paramIndex++}`)
    values.push(data.zoneId)
  }
  if (data.spawnLocations !== undefined) {
    updates.push(`spawn_locations = $${paramIndex++}`)
    values.push(JSON.stringify(data.spawnLocations))
  }
  if (data.aiModelUsed !== undefined) {
    updates.push(`ai_model_used = $${paramIndex++}`)
    values.push(data.aiModelUsed)
  }
  if (data.generationMetadata !== undefined) {
    updates.push(`generation_metadata = $${paramIndex++}`)
    values.push(JSON.stringify(data.generationMetadata))
  }
  if (data.assetUrls !== undefined) {
    updates.push(`asset_urls = $${paramIndex++}`)
    values.push(JSON.stringify(data.assetUrls))
  }

  if (updates.length === 0) {
    // No updates provided, return existing record
    const existing = await getNPC(id)
    if (!existing) {
      throw new Error(`NPC with id ${id} not found`)
    }
    return existing
  }

  values.push(id)
  const [npc] = await query<NPC>(
    `UPDATE npcs SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values,
  )
  if (npc === undefined) {
    throw new Error(`Failed to update NPC with id ${id}`)
  }
  return npc
}

export async function deleteNPC(id: string): Promise<void> {
  ensureDatabase()

  await query("DELETE FROM npcs WHERE id = $1", [id])
}
