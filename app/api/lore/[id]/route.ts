import { NextRequest } from "next/server"
import {
  createApiHandler,
  successResponse,
  errorResponse,
  type ApiContext,
} from "@/lib/middleware/api"
import * as loreRepo from "@/lib/db/repositories/lore"
import { createAuditLog } from "@/lib/db/audit"
import { invalidateEntity } from "@/lib/cache/patterns"
import { updateLoreSchema } from "@/lib/validation/schemas"

export const GET = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const id = ctx.params?.["id"]
    if (!id) {
      return errorResponse("ID is required", "MISSING_ID", 400)
    }

    const lore = await loreRepo.getLoreEntry(id)
    if (!lore) {
      return errorResponse("Lore entry not found", "NOT_FOUND", 404)
    }

    return successResponse(lore)
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
    const lore = await loreRepo.updateLoreEntry(id, body)
    await createAuditLog("update", "lore", id, body)
    await invalidateEntity("lore", id)

    return successResponse(lore, "Lore entry updated successfully")
  },
  {
    auth: true,
    validation: { body: updateLoreSchema },
    rateLimit: { requests: 30, window: 60 },
  },
)

export const DELETE = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const id = ctx.params?.["id"]
    if (!id) {
      return errorResponse("ID is required", "MISSING_ID", 400)
    }

    await loreRepo.deleteLoreEntry(id)
    await createAuditLog("delete", "lore", id)
    await invalidateEntity("lore", id)

    return successResponse(null, "Lore entry deleted successfully")
  },
  {
    auth: true,
    rateLimit: { requests: 30, window: 60 },
  },
)
