import { query } from "../client"

interface Relationship {
  id: string
  entityAId: string
  entityAType: string
  entityBId: string
  entityBType: string
  relationshipType: string
  strength: number
  description?: string
  zoneContext?: string
  createdAt: Date
  updatedAt: Date
}

export async function createRelationship(
  data: Omit<Relationship, "id" | "createdAt" | "updatedAt">,
): Promise<Relationship> {
  const [relationship] = await query<Relationship>(
    `INSERT INTO relationships (entity_a_id, entity_a_type, entity_b_id, entity_b_type, relationship_type, strength, description, zone_context)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      data.entityAId,
      data.entityAType,
      data.entityBId,
      data.entityBType,
      data.relationshipType,
      data.strength,
      data.description || null,
      data.zoneContext || null,
    ],
  )
  if (!relationship) {
    throw new Error("Failed to create relationship: no rows returned")
  }
  return relationship
}

export async function getRelationship(id: string): Promise<Relationship | null> {
  const [relationship] = await query<Relationship>("SELECT * FROM relationships WHERE id = $1", [id])
  return relationship || null
}

export async function getRelationshipsForEntity(entityId: string): Promise<Relationship[]> {
  return query<Relationship>("SELECT * FROM relationships WHERE entity_a_id = $1 OR entity_b_id = $1", [entityId])
}

export async function getRelationshipsByZone(zoneId: string): Promise<Relationship[]> {
  return query<Relationship>("SELECT * FROM relationships WHERE zone_context = $1", [zoneId])
}

export async function updateRelationship(id: string, data: Partial<Relationship>): Promise<Relationship> {
  const updates: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (data.strength !== undefined) {
    updates.push(`strength = $${paramIndex++}`)
    values.push(data.strength)
  }
  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex++}`)
    values.push(data.description)
  }
  if (data.relationshipType !== undefined) {
    updates.push(`relationship_type = $${paramIndex++}`)
    values.push(data.relationshipType)
  }

  if (updates.length === 0) {
    throw new Error("No fields provided for update")
  }

  values.push(id)
  const [relationship] = await query<Relationship>(
    `UPDATE relationships SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values,
  )
  if (!relationship) {
    throw new Error(`Relationship with id ${id} not found`)
  }
  return relationship
}

export async function deleteRelationship(id: string): Promise<void> {
  await query("DELETE FROM relationships WHERE id = $1", [id])
}
