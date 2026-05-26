import { NextRequest } from "next/server"
import {
  createApiHandler,
  successResponse,
  errorResponse,
  type ApiContext,
} from "@/lib/middleware/api"
import { searchNPCs } from "@/lib/search/api"

export const GET = createApiHandler(
  async (req: NextRequest, _ctx: ApiContext) => {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")
    const type = searchParams.get("type")
    const limitParam = searchParams.get("limit")
    const limit = limitParam ? parseInt(limitParam, 10) : 20

    if (!q) {
      return errorResponse("Search query (q) is required", "MISSING_QUERY", 400)
    }

    if (type === "npc" || !type) {
      const results = await searchNPCs({ query: q, limit })
      return successResponse(results)
    }

    return errorResponse(
      `Unsupported search type: ${type}`,
      "UNSUPPORTED_TYPE",
      400,
    )
  },
  {
    auth: true,
    rateLimit: { requests: 100, window: 60 },
  },
)
