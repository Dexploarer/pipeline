import { NextRequest } from "next/server"
import {
  createApiHandler,
  successResponse,
  errorResponse,
  type ApiContext,
} from "@/lib/middleware/api"
import * as dialogueTreeRepo from "@/lib/db/repositories/dialogue-trees"
import { createAuditLog } from "@/lib/db/audit"
import { invalidateEntity } from "@/lib/cache/patterns"
import { updateDialogueTreeSchema } from "@/lib/validation/schemas"

export const GET = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const id = ctx.params?.["id"]
    if (!id) {
      return errorResponse("ID is required", "MISSING_ID", 400)
    }

    const tree = await dialogueTreeRepo.getDialogueTree(id)
    if (!tree) {
      return errorResponse("Dialogue tree not found", "NOT_FOUND", 404)
    }

    return successResponse(tree)
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
    const tree = await dialogueTreeRepo.updateDialogueTree(id, body)
    await createAuditLog("update", "dialogue-tree", id, body)
    await invalidateEntity("dialogue-tree", id)

    return successResponse(tree, "Dialogue tree updated successfully")
  },
  {
    auth: true,
    validation: { body: updateDialogueTreeSchema },
    rateLimit: { requests: 30, window: 60 },
  },
)

export const DELETE = createApiHandler(
  async (_req: NextRequest, ctx: ApiContext) => {
    const id = ctx.params?.["id"]
    if (!id) {
      return errorResponse("ID is required", "MISSING_ID", 400)
    }

    await dialogueTreeRepo.deleteDialogueTree(id)
    await createAuditLog("delete", "dialogue-tree", id)
    await invalidateEntity("dialogue-tree", id)

    return successResponse(null, "Dialogue tree deleted successfully")
  },
  {
    auth: true,
    rateLimit: { requests: 30, window: 60 },
  },
)
