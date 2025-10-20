import { query } from "../client"

export interface QuestObjective {
  type: string
  description: string
  quantity?: number
  target?: string
}

export interface QuestReward {
  experience?: number
  gold?: number
  items?: Array<{ id: string; quantity: number }>
}

export interface Quest {
  id: string
  title: string
  description?: string
  questType: string
  difficulty?: string
  duration?: number
  zoneId?: string
  layers: Record<string, unknown>
  objectives?: QuestObjective[]
  branches?: Record<string, unknown>[]
  rewards?: QuestReward
  prerequisites?: Record<string, unknown>
  npcIds?: string[]
  status: string
  createdAt: Date
  updatedAt: Date
}

export async function createQuest(data: Omit<Quest, "id" | "createdAt" | "updatedAt">): Promise<Quest> {
  const [quest] = await query<Quest>(
    `INSERT INTO quests (title, description, quest_type, difficulty, duration, zone_id, layers, objectives, branches, rewards, prerequisites, npc_ids, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [
      data.title,
      data.description || null,
      data.questType,
      data.difficulty || null,
      data.duration || null,
      data.zoneId || null,
      JSON.stringify(data.layers),
      JSON.stringify(data.objectives || []),
      JSON.stringify(data.branches || []),
      JSON.stringify(data.rewards || {}),
      JSON.stringify(data.prerequisites || {}),
      data.npcIds || [],
      data.status || "draft",
    ],
  )
  if (!quest) throw new Error("Failed to create quest")
  return quest
}

export async function getQuest(id: string): Promise<Quest | null> {
  const [quest] = await query<Quest>("SELECT * FROM quests WHERE id = $1", [id])
  return quest || null
}

export async function getAllQuests(): Promise<Quest[]> {
  return query<Quest>("SELECT * FROM quests ORDER BY created_at DESC")
}

export async function getQuestsByZone(zoneId: string): Promise<Quest[]> {
  return query<Quest>("SELECT * FROM quests WHERE zone_id = $1 ORDER BY title ASC", [zoneId])
}

export async function updateQuest(id: string, data: Partial<Quest>): Promise<Quest> {
  const updates: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (data.title !== undefined) {
    updates.push(`title = $${paramIndex++}`)
    values.push(data.title)
  }
  if (data.status !== undefined) {
    updates.push(`status = $${paramIndex++}`)
    values.push(data.status)
  }
  if (data.layers !== undefined) {
    updates.push(`layers = $${paramIndex++}`)
    values.push(JSON.stringify(data.layers))
  }

  values.push(id)
  const [quest] = await query<Quest>(
    `UPDATE quests SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values,
  )
  if (!quest) {
    throw new Error(`Quest not found for id ${id}`)
  }
  return quest
}

export async function deleteQuest(id: string): Promise<void> {
  await query("DELETE FROM quests WHERE id = $1", [id])
}
