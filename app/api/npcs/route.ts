import { NextRequest } from "next/server"
import {
  createApiHandler,
  getPaginationParams,
  successResponse,
  paginatedResponse,
  type ApiContext,
} from "@/lib/middleware/api"
import * as npcRepo from "@/lib/db/repositories/npcs"
import { createAuditLog } from "@/lib/db/audit"
import { invalidateEntity } from "@/lib/cache/patterns"
import { createNPCSchema } from "@/lib/validation/schemas"
import { searchNPCs } from "@/lib/search/api"

export const GET = createApiHandler(
  async (req: NextRequest, _ctx: ApiContext) => {
    const { page, limit, offset } = getPaginationParams(req)
    const { searchParams } = new URL(req.url)
    const zoneId = searchParams.get("zoneId")
    const archetype = searchParams.get("archetype")
    const search = searchParams.get("search")

    if (search) {
      const results = await searchNPCs({ query: search, limit })
      return successResponse(results)
    }

    let npcs = zoneId
      ? await npcRepo.getNPCsByZone(zoneId)
      : await npcRepo.getAllNPCs()

    if (archetype) {
      npcs = npcs.filter((npc) => npc.archetype === archetype)
    }

    const total = npcs.length
    const paginated = npcs.slice(offset, offset + limit)

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
    const npc = await npcRepo.createNPC(body)
    await createAuditLog("create", "npc", npc.id)
    await invalidateEntity("npc", npc.id)
    return successResponse(npc, "NPC created successfully")
  },
  {
    auth: true,
    validation: { body: createNPCSchema },
    rateLimit: { requests: 30, window: 60 },
  },
)
