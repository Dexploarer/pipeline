import { NextRequest } from "next/server"
import {
  createApiHandler,
  successResponse,
  errorResponse,
  type ApiContext,
} from "@/lib/middleware/api"
import * as relationshipRepo from "@/lib/db/repositories/relationships"
import { createAuditLog } from "@/lib/db/audit"
import { invalidateEntity } from "@/lib/cache/patterns"
import { updateRelationshipSchema } from "@/lib/validation/schemas"

export const GET = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const id = ctx.params?.["id"]
    if (!id) {
      return errorResponse("ID is required", "MISSING_ID", 400)
    }

    const relationship = await relationshipRepo.getRelationship(id)
    if (!relationship) {
      return errorResponse("Relationship not found", "NOT_FOUND", 404)
    }

    return successResponse(relationship)
  },
  {
    auth: true,
    rateLimit: { requests: 100, window: 60 },
  },
)

export const PUT = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    const id = ctx.params?.["id"]
    if (!id) {
      return errorResponse("ID is required", "MISSING_ID", 400)
    }

    const existing = await relationshipRepo.getRelationship(id)
    if (!existing) {
      return errorResponse("Relationship not found", "NOT_FOUND", 404)
    }

    const body = await req.json()
    const relationship = await relationshipRepo.updateRelationship(id, body)
    await createAuditLog("update", "relationship", id, body)
    await invalidateEntity("relationship", id)

    return successResponse(relationship, "Relationship updated successfully")
  },
  {
    auth: true,
    validation: { body: updateRelationshipSchema },
    rateLimit: { requests: 30, window: 60 },
  },
)

export const DELETE = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const id = ctx.params?.["id"]
    if (!id) {
      return errorResponse("ID is required", "MISSING_ID", 400)
    }

    const existing = await relationshipRepo.getRelationship(id)
    if (!existing) {
      return errorResponse("Relationship not found", "NOT_FOUND", 404)
    }

    await relationshipRepo.deleteRelationship(id)
    await createAuditLog("delete", "relationship", id)
    await invalidateEntity("relationship", id)

    return successResponse(null, "Relationship deleted successfully")
  },
  {
    auth: true,
    rateLimit: { requests: 30, window: 60 },
  },
)
