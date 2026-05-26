import { NextRequest } from "next/server"
import {
  createApiHandler,
  getPaginationParams,
  successResponse,
  errorResponse,
  paginatedResponse,
  type ApiContext,
} from "@/lib/middleware/api"
import * as relationshipRepo from "@/lib/db/repositories/relationships"
import { createAuditLog } from "@/lib/db/audit"
import { invalidateEntity } from "@/lib/cache/patterns"
import { createRelationshipSchema } from "@/lib/validation/schemas"

export const GET = createApiHandler(
  async (req: NextRequest, _ctx: ApiContext) => {
    const { page, limit, offset } = getPaginationParams(req)
    const { searchParams } = new URL(req.url)
    const entityId = searchParams.get("entityId")

    if (!entityId) {
      return errorResponse(
        "entityId query parameter is required",
        "MISSING_FILTER",
        400,
      )
    }

    const relationships = await relationshipRepo.getRelationshipsForEntity(entityId)
    const total = relationships.length
    const paginated = relationships.slice(offset, offset + limit)

    return paginatedResponse(paginated, total, page, limit)
  },
  {
    auth: true,
    rateLimit: { requests: 100, window: 60 },
  },
)

export const POST = createApiHandler(
  async (req: NextRequest, _ctx: ApiContext) => {
    const body = await req.json()
    const relationship = await relationshipRepo.createRelationship(body)
    await createAuditLog("create", "relationship", relationship.id)
    await invalidateEntity("relationship", relationship.id)
    return successResponse(relationship, "Relationship created successfully")
  },
  {
    auth: true,
    validation: { body: createRelationshipSchema },
    rateLimit: { requests: 30, window: 60 },
  },
)
