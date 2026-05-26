import { getUserId } from "../auth/session"
import { query, isDatabaseAvailable } from "./client"
import { logger } from "@/lib/logging/logger"

// Audit log for tracking changes
export interface AuditLog {
  id: string
  userId: string
  action: "create" | "update" | "delete"
  entityType: string
  entityId: string
  changes?: Record<string, unknown>
  timestamp: Date
}

// Create audit log entry
export async function createAuditLog(
  action: AuditLog["action"],
  entityType: string,
  entityId: string,
  changes?: Record<string, unknown>,
): Promise<void> {
  try {
    const userId = await getUserId()

    if (isDatabaseAvailable()) {
      await query(
        'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
        [userId, action, entityType, entityId, changes ? JSON.stringify(changes) : null]
      )
    } else {
      logger.info("Audit log entry", {
        userId,
        action,
        entityType,
        entityId,
        changes,
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    logger.error("Failed to create audit log", error as Error, {
      action,
      entityType,
      entityId,
    })
  }
}

// Get audit logs for an entity
export async function getAuditLogs(entityType: string, entityId: string): Promise<AuditLog[]> {
  try {
    const rows = await query<AuditLog>(
      'SELECT * FROM audit_logs WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC LIMIT 100',
      [entityType, entityId]
    )
    return rows
  } catch (error) {
    logger.error("Failed to get audit logs", error as Error, {
      entityType,
      entityId,
    })
    return []
  }
}
