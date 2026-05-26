import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest, NextResponse } from "next/server"

// Mock the middleware to bypass validation/auth/rate-limit and avoid double body read
vi.mock("@/lib/middleware/api", () => {
  return {
    createApiHandler: (handler: Function) => {
      return async (req: Request, context?: { params?: Record<string, string> }) => {
        const apiContext = {
          requestId: "test-req-id",
          userId: "test-user",
          params: context?.params,
          tracker: { checkpoint: () => {}, getDuration: () => 10 },
        }
        return handler(req, apiContext)
      }
    },
    getPaginationParams: (req: Request) => {
      const { searchParams } = new URL(req.url)
      const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")))
      const offset = (page - 1) * limit
      return { page, limit, offset }
    },
    successResponse: <T,>(data: T, message?: string) => {
      return NextResponse.json({
        success: true,
        data,
        ...(message && { message }),
      })
    },
    errorResponse: (message: string, code?: string, status: number = 400) => {
      return NextResponse.json(
        { success: false, error: message, ...(code && { code }) },
        { status },
      )
    },
    paginatedResponse: <T,>(data: T[], total: number, page: number, limit: number) => {
      return NextResponse.json({
        success: true,
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      })
    },
  }
})

// Mock dependencies
vi.mock("@/lib/search/api", () => ({
  searchNPCs: vi.fn(),
}))

vi.mock("@/lib/db/audit", () => ({
  createAuditLog: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/cache/patterns", () => ({
  invalidateEntity: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/auth/session", () => ({
  getUserFromRequest: vi.fn().mockResolvedValue({
    id: "test-user",
    email: "test@test.com",
    name: "Test",
    role: "admin",
    createdAt: new Date(),
  }),
}))

vi.mock("@/lib/cache/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    allowed: true,
    remaining: 99,
    resetAt: Date.now() + 60000,
    limit: 100,
  }),
}))

vi.mock("@/lib/logging/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    api: { request: vi.fn(), response: vi.fn(), error: vi.fn() },
    ai: { generation: vi.fn(), cacheHit: vi.fn(), cacheMiss: vi.fn(), error: vi.fn() },
    db: { query: vi.fn(), error: vi.fn() },
    cache: { hit: vi.fn(), miss: vi.fn(), set: vi.fn(), error: vi.fn() },
  },
  generateRequestId: vi.fn().mockReturnValue("test-req-id"),
  PerformanceTracker: vi.fn().mockImplementation(() => ({
    checkpoint: vi.fn(),
    getDuration: vi.fn().mockReturnValue(10),
    getCheckpoints: vi.fn().mockReturnValue({}),
    log: vi.fn(),
  })),
  handleError: vi.fn().mockReturnValue({
    statusCode: 500,
    message: "Internal server error",
    code: "INTERNAL_ERROR",
  }),
  ValidationError: class ValidationError extends Error {
    statusCode = 400
    code = "VALIDATION_ERROR"
    constructor(message: string, public errors?: unknown) {
      super(message)
      this.name = "ValidationError"
    }
  },
  AppError: class AppError extends Error {
    constructor(message: string, public statusCode: number = 500, public code?: string) {
      super(message)
      this.name = "AppError"
    }
  },
}))

import { searchNPCs } from "@/lib/search/api"
import { GET } from "@/app/api/search/route"

const mockSearchResults = {
  results: [
    {
      id: "npc-1",
      score: 0.95,
      data: {
        id: "npc-1",
        name: "Test Warrior",
        archetype: "warrior",
        personality: { traits: ["brave"] },
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
      metadata: {},
    },
  ],
  total: 1,
  took: 15,
}

describe("Search API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("GET /api/search", () => {
    it("calls searchNPCs with query parameter", async () => {
      vi.mocked(searchNPCs).mockResolvedValue(mockSearchResults as never)

      const req = new NextRequest(
        "http://localhost:3000/api/search?q=warrior",
        {
          method: "GET",
          headers: { Authorization: "Bearer test-token" },
        },
      )

      const response = await GET(req)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockSearchResults)
      expect(searchNPCs).toHaveBeenCalledWith({ query: "warrior", limit: 20 })
    })

    it("returns error when q parameter is missing", async () => {
      const req = new NextRequest("http://localhost:3000/api/search", {
        method: "GET",
        headers: { Authorization: "Bearer test-token" },
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe("Search query (q) is required")
    })

    it("passes limit parameter to searchNPCs", async () => {
      vi.mocked(searchNPCs).mockResolvedValue(mockSearchResults as never)

      const req = new NextRequest(
        "http://localhost:3000/api/search?q=test&limit=5",
        {
          method: "GET",
          headers: { Authorization: "Bearer test-token" },
        },
      )

      const response = await GET(req)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(searchNPCs).toHaveBeenCalledWith({ query: "test", limit: 5 })
    })
  })
})
