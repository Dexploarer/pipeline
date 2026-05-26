import { NextRequest } from "next/server"
import {
  createApiHandler,
  successResponse,
  errorResponse,
  type ApiContext,
} from "@/lib/middleware/api"
import * as questRepo from "@/lib/db/repositories/quests"
import { createAuditLog } from "@/lib/db/audit"
import { invalidateEntity } from "@/lib/cache/patterns"
import { updateQuestSchema } from "@/lib/validation/schemas"

export const GET = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const id = ctx.params?.["id"]
    if (!id) {
      return errorResponse("ID is required", "MISSING_ID", 400)
    }

    const quest = await questRepo.getQuest(id)
    if (!quest) {
      return errorResponse("Quest not found", "NOT_FOUND", 404)
    }

    return successResponse(quest)
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
    const quest = await questRepo.updateQuest(id, body)
    await createAuditLog("update", "quest", id, body)
    await invalidateEntity("quest", id)

    return successResponse(quest, "Quest updated successfully")
  },
  {
    auth: true,
    validation: { body: updateQuestSchema },
    rateLimit: { requests: 30, window: 60 },
  },
)

export const DELETE = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const id = ctx.params?.["id"]
    if (!id) {
      return errorResponse("ID is required", "MISSING_ID", 400)
    }

    await questRepo.deleteQuest(id)
    await createAuditLog("delete", "quest", id)
    await invalidateEntity("quest", id)

    return successResponse(null, "Quest deleted successfully")
  },
  {
    auth: true,
    rateLimit: { requests: 30, window: 60 },
  },
)
