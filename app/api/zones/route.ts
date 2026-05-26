import { NextRequest } from "next/server"
import {
  createApiHandler,
  getPaginationParams,
  successResponse,
  paginatedResponse,
  type ApiContext,
} from "@/lib/middleware/api"
import * as zoneRepo from "@/lib/db/repositories/zones"
import { createAuditLog } from "@/lib/db/audit"
import { invalidateEntity } from "@/lib/cache/patterns"
import { createZoneSchema } from "@/lib/validation/schemas"

export const GET = createApiHandler(
  async (req: NextRequest, _ctx: ApiContext) => {
    const { page, limit, offset } = getPaginationParams(req)
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")
    const parentZoneId = searchParams.get("parentZoneId")

    let zones = await zoneRepo.getAllZones()

    if (type) {
      zones = zones.filter((zone) => zone.type === type)
    }

    if (parentZoneId) {
      zones = zones.filter((zone) => zone.parentRegionId === parentZoneId)
    }

    const total = zones.length
    const paginated = zones.slice(offset, offset + limit)

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
    const zone = await zoneRepo.createZone(body)
    await createAuditLog("create", "zone", zone.id)
    await invalidateEntity("zone", zone.id)
    return successResponse(zone, "Zone created successfully")
  },
  {
    auth: true,
    validation: { body: createZoneSchema },
    rateLimit: { requests: 30, window: 60 },
  },
)
