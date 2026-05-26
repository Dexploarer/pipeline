import { NextRequest } from "next/server"
import {
  createApiHandler,
  successResponse,
  errorResponse,
  type ApiContext,
} from "@/lib/middleware/api"
import * as zoneRepo from "@/lib/db/repositories/zones"
import { createAuditLog } from "@/lib/db/audit"
import { invalidateEntity } from "@/lib/cache/patterns"
import { updateZoneSchema } from "@/lib/validation/schemas"

export const GET = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const id = ctx.params?.["id"]
    if (!id) {
      return errorResponse("ID is required", "MISSING_ID", 400)
    }

    const zone = await zoneRepo.getZone(id)
    if (!zone) {
      return errorResponse("Zone not found", "NOT_FOUND", 404)
    }

    return successResponse(zone)
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

    const body = await req.json()
    const zone = await zoneRepo.updateZone(id, body)
    await createAuditLog("update", "zone", id, body)
    await invalidateEntity("zone", id)

    return successResponse(zone, "Zone updated successfully")
  },
  {
    auth: true,
    validation: { body: updateZoneSchema },
    rateLimit: { requests: 30, window: 60 },
  },
)

export const DELETE = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const id = ctx.params?.["id"]
    if (!id) {
      return errorResponse("ID is required", "MISSING_ID", 400)
    }

    await zoneRepo.deleteZone(id)
    await createAuditLog("delete", "zone", id)
    await invalidateEntity("zone", id)

    return successResponse(null, "Zone deleted successfully")
  },
  {
    auth: true,
    rateLimit: { requests: 30, window: 60 },
  },
)
