import { NextRequest } from "next/server"
import {
  createApiHandler,
  getPaginationParams,
  successResponse,
  paginatedResponse,
  type ApiContext,
} from "@/lib/middleware/api"
import * as contentPackRepo from "@/lib/db/repositories/content-packs"
import { createAuditLog } from "@/lib/db/audit"
import { invalidateEntity } from "@/lib/cache/patterns"
import { createContentPackSchema } from "@/lib/validation/schemas"

export const GET = createApiHandler(
  async (req: NextRequest, _ctx: ApiContext) => {
    const { page, limit, offset } = getPaginationParams(req)
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")
    const status = searchParams.get("status")

    let packs = await contentPackRepo.getAllContentPacks()

    if (category) {
      packs = packs.filter(
        (pack) => (pack.metadata as Record<string, unknown> | undefined)?.["category"] === category,
      )
    }

    if (status) {
      packs = packs.filter(
        (pack) => (pack.metadata as Record<string, unknown> | undefined)?.["status"] === status,
      )
    }

    const total = packs.length
    const paginated = packs.slice(offset, offset + limit)

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
    const pack = await contentPackRepo.createContentPack(body)
    await createAuditLog("create", "content-pack", pack.id)
    await invalidateEntity("content-pack", pack.id)
    return successResponse(pack, "Content pack created successfully")
  },
  {
    auth: true,
    validation: { body: createContentPackSchema },
    rateLimit: { requests: 30, window: 60 },
  },
)
