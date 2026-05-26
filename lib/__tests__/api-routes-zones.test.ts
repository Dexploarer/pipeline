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
vi.mock("@/lib/db/repositories/zones", () => ({
  getAllZones: vi.fn(),
  getZone: vi.fn(),
  createZone: vi.fn(),
  updateZone: vi.fn(),
  deleteZone: vi.fn(),
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

import * as zoneRepo from "@/lib/db/repositories/zones"
import { createAuditLog } from "@/lib/db/audit"
import { invalidateEntity } from "@/lib/cache/patterns"
import { GET, POST } from "@/app/api/zones/route"
import {
  GET as GET_BY_ID,
  PUT,
  DELETE,
} from "@/app/api/zones/[id]/route"

const mockZones = [
  {
    id: "zone-test-1",
    name: "Test City",
    description: "A test city",
    type: "city",
    dangerLevel: 1,
    parentRegionId: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "zone-test-2",
    name: "Dark Forest",
    description: "A dangerous forest",
    type: "wilderness",
    dangerLevel: 5,
    parentRegionId: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "zone-test-3",
    name: "Market Square",
    description: "A busy market",
    type: "city",
    dangerLevel: 1,
    parentRegionId: "zone-test-1",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
]

describe("Zone API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("GET /api/zones", () => {
    it("returns paginated zone list", async () => {
      vi.mocked(zoneRepo.getAllZones).mockResolvedValue(mockZones as never)

      const req = new NextRequest(
        "http://localhost:3000/api/zones?page=1&limit=10",
        {
          method: "GET",
          headers: { Authorization: "Bearer test-token" },
        },
      )

      const response = await GET(req)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(3)
      expect(data.pagination).toBeDefined()
      expect(data.pagination.total).toBe(3)
      expect(data.pagination.page).toBe(1)
      expect(zoneRepo.getAllZones).toHaveBeenCalled()
    })

    it("filters zones by type", async () => {
      vi.mocked(zoneRepo.getAllZones).mockResolvedValue(mockZones as never)

      const req = new NextRequest(
        "http://localhost:3000/api/zones?type=city",
        {
          method: "GET",
          headers: { Authorization: "Bearer test-token" },
        },
      )

      const response = await GET(req)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.data[0].type).toBe("city")
      expect(data.data[1].type).toBe("city")
    })
  })

  describe("POST /api/zones", () => {
    it("creates zone with validation", async () => {
      const newZone = {
        id: "zone-new-1",
        name: "New Zone",
        description: "A new zone",
        type: "city",
        dangerLevel: 2,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      }
      vi.mocked(zoneRepo.createZone).mockResolvedValue(newZone as never)

      const req = new NextRequest("http://localhost:3000/api/zones", {
        method: "POST",
        headers: {
          Authorization: "Bearer test-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "New Zone",
          description: "A new zone",
          type: "city",
          dangerLevel: 2,
        }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data).toEqual(newZone)
      expect(zoneRepo.createZone).toHaveBeenCalled()
      expect(createAuditLog).toHaveBeenCalledWith("create", "zone", "zone-new-1")
      expect(invalidateEntity).toHaveBeenCalledWith("zone", "zone-new-1")
    })
  })

  describe("GET /api/zones/[id]", () => {
    it("returns 404 for non-existent zone", async () => {
      vi.mocked(zoneRepo.getZone).mockResolvedValue(null as never)

      const req = new NextRequest(
        "http://localhost:3000/api/zones/nonexistent-id",
        {
          method: "GET",
          headers: { Authorization: "Bearer test-token" },
        },
      )

      const response = await GET_BY_ID(req, {
        params: { id: "nonexistent-id" },
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe("Zone not found")
    })

    it("returns zone when found", async () => {
      vi.mocked(zoneRepo.getZone).mockResolvedValue(mockZones[0] as never)

      const req = new NextRequest(
        "http://localhost:3000/api/zones/zone-test-1",
        {
          method: "GET",
          headers: { Authorization: "Bearer test-token" },
        },
      )

      const response = await GET_BY_ID(req, {
        params: { id: "zone-test-1" },
      })
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data.id).toBe("zone-test-1")
      expect(data.data.name).toBe("Test City")
    })
  })

  describe("PUT /api/zones/[id]", () => {
    it("updates zone and calls audit log and cache invalidation", async () => {
      const updatedZone = { ...mockZones[0], name: "Updated City" }
      vi.mocked(zoneRepo.updateZone).mockResolvedValue(updatedZone as never)

      const req = new NextRequest(
        "http://localhost:3000/api/zones/zone-test-1",
        {
          method: "PUT",
          headers: {
            Authorization: "Bearer test-token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: "Updated City" }),
        },
      )

      const response = await PUT(req, { params: { id: "zone-test-1" } })
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data.name).toBe("Updated City")
      expect(zoneRepo.updateZone).toHaveBeenCalledWith("zone-test-1", {
        name: "Updated City",
      })
      expect(createAuditLog).toHaveBeenCalledWith("update", "zone", "zone-test-1", {
        name: "Updated City",
      })
      expect(invalidateEntity).toHaveBeenCalledWith("zone", "zone-test-1")
    })
  })

  describe("DELETE /api/zones/[id]", () => {
    it("deletes zone and calls audit log and cache invalidation", async () => {
      vi.mocked(zoneRepo.deleteZone).mockResolvedValue(undefined as never)

      const req = new NextRequest(
        "http://localhost:3000/api/zones/zone-test-1",
        {
          method: "DELETE",
          headers: { Authorization: "Bearer test-token" },
        },
      )

      const response = await DELETE(req, { params: { id: "zone-test-1" } })
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(zoneRepo.deleteZone).toHaveBeenCalledWith("zone-test-1")
      expect(createAuditLog).toHaveBeenCalledWith(
        "delete",
        "zone",
        "zone-test-1",
      )
      expect(invalidateEntity).toHaveBeenCalledWith("zone", "zone-test-1")
    })
  })
})
