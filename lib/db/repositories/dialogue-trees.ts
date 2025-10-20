import { query } from "../client"

interface DialogueTree {
  id: string
  npcId?: string
  questId?: string
  treeData: any
  createdAt: Date
  updatedAt: Date
}

export async function createDialogueTree(
  data: Omit<DialogueTree, "id" | "createdAt" | "updatedAt">,
): Promise<DialogueTree> {
  const result = await query<DialogueTree>(
    `INSERT INTO dialogue_trees (npc_id, quest_id, tree_data)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [data.npcId || null, data.questId || null, JSON.stringify(data.treeData)],
  )
  if (!result || result.length === 0) {
    throw new Error("Failed to create dialogue tree: no rows returned")
  }
  const tree = result[0]
  if (!tree) throw new Error("Failed to create dialogue tree")
  return tree
}

export async function getDialogueTree(id: string): Promise<DialogueTree | null> {
  const [tree] = await query<DialogueTree>("SELECT * FROM dialogue_trees WHERE id = $1", [id])
  return tree || null
}

export async function getDialogueTreesByNPC(npcId: string): Promise<DialogueTree[]> {
  return query<DialogueTree>("SELECT * FROM dialogue_trees WHERE npc_id = $1", [npcId])
}

export async function getDialogueTreesByQuest(questId: string): Promise<DialogueTree[]> {
  return query<DialogueTree>("SELECT * FROM dialogue_trees WHERE quest_id = $1", [questId])
}

export async function updateDialogueTree(id: string, data: Partial<DialogueTree>): Promise<DialogueTree> {
  const updates: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (data.treeData !== undefined) {
    updates.push(`tree_data = $${paramIndex++}`)
    values.push(JSON.stringify(data.treeData))
  }

  if (updates.length === 0) {
    // No updates provided, return existing record
    const existing = await getDialogueTree(id)
    if (!existing) {
      throw new Error(`Dialogue tree with id ${id} not found`)
    }
    return existing
  }

  values.push(id)
  const [tree] = await query<DialogueTree>(
    `UPDATE dialogue_trees SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values,
  )
  if (!tree) throw new Error("Failed to update dialogue tree")
  return tree
}

export async function deleteDialogueTree(id: string): Promise<void> {
  await query("DELETE FROM dialogue_trees WHERE id = $1", [id])
}
