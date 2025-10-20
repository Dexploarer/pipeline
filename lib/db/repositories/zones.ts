import { query } from "../client"
import type { Zone } from "@/lib/npc-types"

export async function createZone(data: Omit<Zone, "id" | "createdAt" | "updatedAt">): Promise<Zone> {
  const [zone] = await query<Zone>(
    `INSERT INTO zones (name, description, type, danger_level, coordinates, connected_zones, environment_data)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.name,
      data.description || null,
      data.type,
      data.dangerLevel,
      JSON.stringify(data.coordinates || null),
      data.connectedZones || [],
      JSON.stringify(data.metadata || {}),
    ],
  )
  if (!zone) throw new Error("Failed to create zone")
  return zone
}

export async function getZone(id: string): Promise<Zone | null> {
  const [zone] = await query<Zone>("SELECT * FROM zones WHERE id = $1", [id])
  return zone || null
}

export async function getAllZones(): Promise<Zone[]> {
  return query<Zone>("SELECT * FROM zones ORDER BY name ASC")
}

export async function updateZone(id: string, data: Partial<Zone>): Promise<Zone> {
  const updates: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex++}`)
    values.push(data.name)
  }
  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex++}`)
    values.push(data.description)
  }
  if (data.type !== undefined) {
    updates.push(`type = $${paramIndex++}`)
    values.push(data.type)
  }
  if (data.dangerLevel !== undefined) {
    updates.push(`danger_level = $${paramIndex++}`)
    values.push(data.dangerLevel)
  }
  if (data.coordinates !== undefined) {
    updates.push(`coordinates = $${paramIndex++}`)
    values.push(JSON.stringify(data.coordinates))
  }
  if (data.connectedZones !== undefined) {
    updates.push(`connected_zones = $${paramIndex++}`)
    values.push(data.connectedZones)
  }
  if (data.metadata !== undefined) {
    updates.push(`environment_data = $${paramIndex++}`)
    values.push(JSON.stringify(data.metadata))
  }

  if (updates.length === 0) {
    // No updates provided, return existing record
    const existing = await getZone(id)
    if (!existing) {
      throw new Error(`Zone with id ${id} not found`)
    }
    return existing
  }

  values.push(id)
  const [zone] = await query<Zone>(
    `UPDATE zones SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values,
  )
  if (!zone) throw new Error("Failed to update zone")
  return zone
}

export async function deleteZone(id: string): Promise<void> {
  await query("DELETE FROM zones WHERE id = $1", [id])
}
