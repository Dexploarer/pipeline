import { NextRequest } from "next/server"
import {
  createApiHandler,
  getPaginationParams,
  successResponse,
  paginatedResponse,
  type ApiContext,
} from "@/lib/middleware/api"
import * as loreRepo from "@/lib/db/repositories/lore"
import { createAuditLog } from "@/lib/db/audit"
import { invalidateEntity } from "@/lib/cache/patterns"
import { createLoreSchema } from "@/lib/validation/schemas"

export const GET = createApiHandler(
  async (req: NextRequest, _ctx: ApiContext) => {
    const { page, limit, offset } = getPaginationParams(req)
    const { searchParams } = new URL(req.url)
    const zoneId = searchParams.get("zoneId")
    const category = searchParams.get("category")
    const tags = searchParams.get("tags")

    let entries: loreRepo.LoreEntry[]

    if (zoneId) {
      entries = await loreRepo.getLoreByZone(zoneId)
    } else if (category) {
      entries = await loreRepo.getLoreByCategory(category)
    } else if (tags) {
      const tagArray = tags.split(",").map((t) => t.trim())
      entries = await loreRepo.searchLoreByTags(tagArray)
    } else {
      entries = await loreRepo.getAllLoreEntries()
    }

    const total = entries.length
    const paginated = entries.slice(offset, offset + limit)

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
    const lore = await loreRepo.createLoreEntry(body)
    await createAuditLog("create", "lore", lore.id)
    await invalidateEntity("lore", lore.id)
    return successResponse(lore, "Lore entry created successfully")
  },
  {
    auth: true,
    validation: { body: createLoreSchema },
    rateLimit: { requests: 30, window: 60 },
  },
)
