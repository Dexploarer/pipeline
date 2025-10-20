import { query } from "../client"

export interface LoreEntry {
  id: string
  title: string
  category: string
  content: string
  tags: string[]
  zoneId?: string
  relatedNpcIds?: string[]
  relatedQuestIds?: string[]
  timelinePosition?: number
  createdAt: Date
  updatedAt: Date
}

export async function createLoreEntry(data: Omit<LoreEntry, "id" | "createdAt" | "updatedAt">): Promise<LoreEntry> {
  const [lore] = await query<LoreEntry>(
    `INSERT INTO lore_entries (title, category, content, tags, zone_id, related_npc_ids, related_quest_ids, timeline_position)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      data.title,
      data.category,
      data.content,
      data.tags || [],
      data.zoneId || null,
      data.relatedNpcIds || [],
      data.relatedQuestIds || [],
      data.timelinePosition || null,
    ],
  )
  if (!lore) throw new Error("Failed to create lore entry")
  return lore
}

export async function getLoreEntry(id: string): Promise<LoreEntry | null> {
  const [lore] = await query<LoreEntry>("SELECT * FROM lore_entries WHERE id = $1", [id])
  return lore || null
}

export async function getAllLoreEntries(): Promise<LoreEntry[]> {
  return query<LoreEntry>("SELECT * FROM lore_entries ORDER BY created_at DESC")
}

export async function getLoreByZone(zoneId: string): Promise<LoreEntry[]> {
  return query<LoreEntry>("SELECT * FROM lore_entries WHERE zone_id = $1 ORDER BY timeline_position ASC", [zoneId])
}

export async function getLoreByCategory(category: string): Promise<LoreEntry[]> {
  return query<LoreEntry>("SELECT * FROM lore_entries WHERE category = $1 ORDER BY title ASC", [category])
}

export async function searchLoreByTags(tags: string[]): Promise<LoreEntry[]> {
  return query<LoreEntry>("SELECT * FROM lore_entries WHERE tags && $1 ORDER BY created_at DESC", [tags])
}

export async function updateLoreEntry(id: string, data: Partial<LoreEntry>): Promise<LoreEntry> {
  const updates: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (data.title !== undefined) {
    updates.push(`title = $${paramIndex++}`)
    values.push(data.title)
  }
  if (data.content !== undefined) {
    updates.push(`content = $${paramIndex++}`)
    values.push(data.content)
  }
  if (data.category !== undefined) {
    updates.push(`category = $${paramIndex++}`)
    values.push(data.category)
  }
  if (data.tags !== undefined) {
    updates.push(`tags = $${paramIndex++}`)
    values.push(data.tags)
  }

  values.push(id)
  const [lore] = await query<LoreEntry>(
    `UPDATE lore_entries SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values,
  )
  if (!lore) {
    throw new Error(`Lore entry not found for id ${id}`)
  }
  return lore
}

export async function deleteLoreEntry(id: string): Promise<void> {
  await query("DELETE FROM lore_entries WHERE id = $1", [id])
}
