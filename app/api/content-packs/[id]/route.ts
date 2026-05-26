import { NextRequest } from "next/server"
import {
  createApiHandler,
  successResponse,
  errorResponse,
  type ApiContext,
} from "@/lib/middleware/api"
import * as contentPackRepo from "@/lib/db/repositories/content-packs"
import { createAuditLog } from "@/lib/db/audit"
import { invalidateEntity } from "@/lib/cache/patterns"
import { updateContentPackSchema } from "@/lib/validation/schemas"

export const GET = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const id = ctx.params?.["id"]
    if (!id) {
      return errorResponse("ID is required", "MISSING_ID", 400)
    }

    const pack = await contentPackRepo.getContentPack(id)
    if (!pack) {
      return errorResponse("Content pack not found", "NOT_FOUND", 404)
    }

    return successResponse(pack)
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

    const existing = await contentPackRepo.getContentPack(id)
    if (!existing) {
      return errorResponse("Content pack not found", "NOT_FOUND", 404)
    }

    const body = await req.json()
    const pack = await contentPackRepo.updateContentPack(id, body)
    await createAuditLog("update", "content-pack", id, body)
    await invalidateEntity("content-pack", id)

    return successResponse(pack, "Content pack updated successfully")
  },
  {
    auth: true,
    validation: { body: updateContentPackSchema },
    rateLimit: { requests: 30, window: 60 },
  },
)

export const DELETE = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const id = ctx.params?.["id"]
    if (!id) {
      return errorResponse("ID is required", "MISSING_ID", 400)
    }

    const existing = await contentPackRepo.getContentPack(id)
    if (!existing) {
      return errorResponse("Content pack not found", "NOT_FOUND", 404)
    }

    await contentPackRepo.deleteContentPack(id)
    await createAuditLog("delete", "content-pack", id)
    await invalidateEntity("content-pack", id)

    return successResponse(null, "Content pack deleted successfully")
  },
  {
    auth: true,
    rateLimit: { requests: 30, window: 60 },
  },
)
