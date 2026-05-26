import { NextRequest } from "next/server"
import {
  createApiHandler,
  getPaginationParams,
  successResponse,
  errorResponse,
  paginatedResponse,
  type ApiContext,
} from "@/lib/middleware/api"
import * as dialogueTreeRepo from "@/lib/db/repositories/dialogue-trees"
import { createAuditLog } from "@/lib/db/audit"
import { invalidateEntity } from "@/lib/cache/patterns"
import { createDialogueTreeSchema } from "@/lib/validation/schemas"

export const GET = createApiHandler(
  async (req: NextRequest, _ctx: ApiContext) => {
    const { page, limit, offset } = getPaginationParams(req)
    const { searchParams } = new URL(req.url)
    const npcId = searchParams.get("npcId")
    const questId = searchParams.get("questId")

    if (!npcId && !questId) {
      return errorResponse(
        "Either npcId or questId query parameter is required",
        "MISSING_FILTER",
        400,
      )
    }

    const trees = npcId
      ? await dialogueTreeRepo.getDialogueTreesByNPC(npcId)
      : await dialogueTreeRepo.getDialogueTreesByQuest(questId!)

    const total = trees.length
    const paginated = trees.slice(offset, offset + limit)

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
    const tree = await dialogueTreeRepo.createDialogueTree(body)
    await createAuditLog("create", "dialogue-tree", tree.id)
    await invalidateEntity("dialogue-tree", tree.id)
    return successResponse(tree, "Dialogue tree created successfully")
  },
  {
    auth: true,
    validation: { body: createDialogueTreeSchema },
    rateLimit: { requests: 30, window: 60 },
  },
)
