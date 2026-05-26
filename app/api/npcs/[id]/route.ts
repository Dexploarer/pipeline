import { NextRequest } from "next/server"
import {
  createApiHandler,
  successResponse,
  errorResponse,
  type ApiContext,
} from "@/lib/middleware/api"
import * as npcRepo from "@/lib/db/repositories/npcs"
import { createAuditLog } from "@/lib/db/audit"
import { invalidateEntity } from "@/lib/cache/patterns"
import { updateNPCSchema } from "@/lib/validation/schemas"

export const GET = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const id = ctx.params?.["id"]
    if (!id) {
      return errorResponse("ID is required", "MISSING_ID", 400)
    }

    const npc = await npcRepo.getNPC(id)
    if (!npc) {
      return errorResponse("NPC not found", "NOT_FOUND", 404)
    }

    return successResponse(npc)
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

    const existing = await npcRepo.getNPC(id)
    if (!existing) {
      return errorResponse("NPC not found", "NOT_FOUND", 404)
    }

    const body = await req.json()
    const npc = await npcRepo.updateNPC(id, body)
    await createAuditLog("update", "npc", id, body)
    await invalidateEntity("npc", id)

    return successResponse(npc, "NPC updated successfully")
  },
  {
    auth: true,
    validation: { body: updateNPCSchema },
    rateLimit: { requests: 30, window: 60 },
  },
)

export const DELETE = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const id = ctx.params?.["id"]
    if (!id) {
      return errorResponse("ID is required", "MISSING_ID", 400)
    }

    const existing = await npcRepo.getNPC(id)
    if (!existing) {
      return errorResponse("NPC not found", "NOT_FOUND", 404)
    }

    await npcRepo.deleteNPC(id)
    await createAuditLog("delete", "npc", id)
    await invalidateEntity("npc", id)

    return successResponse(null, "NPC deleted successfully")
  },
  {
    auth: true,
    rateLimit: { requests: 30, window: 60 },
  },
)
