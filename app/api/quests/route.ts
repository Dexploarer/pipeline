import { NextRequest } from "next/server"
import {
  createApiHandler,
  getPaginationParams,
  successResponse,
  paginatedResponse,
  type ApiContext,
} from "@/lib/middleware/api"
import * as questRepo from "@/lib/db/repositories/quests"
import { createAuditLog } from "@/lib/db/audit"
import { invalidateEntity } from "@/lib/cache/patterns"
import { createQuestSchema } from "@/lib/validation/schemas"

export const GET = createApiHandler(
  async (req: NextRequest, _ctx: ApiContext) => {
    const { page, limit, offset } = getPaginationParams(req)
    const { searchParams } = new URL(req.url)
    const zoneId = searchParams.get("zoneId")
    const status = searchParams.get("status")

    let quests = zoneId
      ? await questRepo.getQuestsByZone(zoneId)
      : await questRepo.getAllQuests()

    if (status) {
      quests = quests.filter((quest) => quest.status === status)
    }

    const total = quests.length
    const paginated = quests.slice(offset, offset + limit)

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
    const quest = await questRepo.createQuest(body)
    await createAuditLog("create", "quest", quest.id)
    await invalidateEntity("quest", quest.id)
    return successResponse(quest, "Quest created successfully")
  },
  {
    auth: true,
    validation: { body: createQuestSchema },
    rateLimit: { requests: 30, window: 60 },
  },
)
