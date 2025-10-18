import { query } from "../client"

interface ContentPack {
  id: string
  name: string
  description?: string
  zoneIds: string[]
  npcIds: string[]
  questIds: string[]
  loreIds: string[]
  version: string
  bundleUrl?: string
  metadata?: any
  createdAt: Date
  updatedAt: Date
}

export async function createContentPack(
  data: Omit<ContentPack, "id" | "createdAt" | "updatedAt">,
): Promise<ContentPack> {
  const [pack] = await query<ContentPack>(
    `INSERT INTO content_packs (name, description, zone_ids, npc_ids, quest_ids, lore_ids, version, bundle_url, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      data.name,
      data.description || null,
      data.zoneIds || [],
      data.npcIds || [],
      data.questIds || [],
      data.loreIds || [],
      data.version,
      data.bundleUrl || null,
      JSON.stringify(data.metadata || {}),
    ],
  )
  return pack
}

export async function getContentPack(id: string): Promise<ContentPack | null> {
  const [pack] = await query<ContentPack>("SELECT * FROM content_packs WHERE id = $1", [id])
  return pack || null
}

export async function getAllContentPacks(): Promise<ContentPack[]> {
  return query<ContentPack>("SELECT * FROM content_packs ORDER BY created_at DESC")
}

export async function updateContentPack(id: string, data: Partial<ContentPack>): Promise<ContentPack> {
  const updates: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex++}`)
    values.push(data.name)
  }
  if (data.bundleUrl !== undefined) {
    updates.push(`bundle_url = $${paramIndex++}`)
    values.push(data.bundleUrl)
  }
  if (data.metadata !== undefined) {
    updates.push(`metadata = $${paramIndex++}`)
    values.push(JSON.stringify(data.metadata))
  }

  if (updates.length === 0) {
    // No updates provided, return existing record
    const existing = await getContentPack(id)
    if (!existing) {
      throw new Error(`Content pack with id ${id} not found`)
    }
    return existing
  }

  values.push(id)
  const [pack] = await query<ContentPack>(
    `UPDATE content_packs SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values,
  )
  return pack
}

export async function deleteContentPack(id: string): Promise<void> {
  await query("DELETE FROM content_packs WHERE id = $1", [id])
}
