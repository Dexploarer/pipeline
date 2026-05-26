import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest, NextResponse } from "next/server"

// Mock the middleware to bypass validation/auth/rate-limit and avoid double body read
vi.mock("@/lib/middleware/api", () => {
  return {
    createApiHandler: (handler: Function) => {
      return async (req: Request, context?: { params?: Promise<Record<string, string>> }) => {
        const resolvedParams = context?.params ? await context.params : undefined
        const apiContext = {
          requestId: "test-req-id",
          userId: "test-user",
          params: resolvedParams,
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
vi.mock("@/lib/db/repositories/npcs", () => ({
  getAllNPCs: vi.fn(),
  getNPCsByZone: vi.fn(),
  getNPC: vi.fn(),
  createNPC: vi.fn(),
  updateNPC: vi.fn(),
  deleteNPC: vi.fn(),
}))

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

import * as npcRepo from "@/lib/db/repositories/npcs"
import { createAuditLog } from "@/lib/db/audit"
import { invalidateEntity } from "@/lib/cache/patterns"
import { GET, POST } from "@/app/api/npcs/route"
import {
  GET as GET_BY_ID,
  PUT,
  DELETE,
} from "@/app/api/npcs/[id]/route"

const mockNPCs = [
  {
    id: "npc-test-1",
    name: "Test Warrior",
    archetype: "warrior",
    personality: { traits: ["brave"] },
    dialogueStyle: "formal",
    backstory: "A test backstory",
    goals: ["test goal"],
    zoneId: "zone-1",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "npc-test-2",
    name: "Test Merchant",
    archetype: "merchant",
    personality: { traits: ["friendly"] },
    dialogueStyle: "casual",
    backstory: "A merchant backstory",
    goals: ["sell goods"],
    zoneId: "zone-1",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "npc-test-3",
    name: "Test Mage",
    archetype: "scholar",
    personality: { traits: ["wise"] },
    dialogueStyle: "arcane",
    backstory: "A mage backstory",
    goals: ["study magic"],
    zoneId: "zone-2",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
]

describe("NPC API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("GET /api/npcs", () => {
    it("returns paginated NPC list", async () => {
      vi.mocked(npcRepo.getAllNPCs).mockResolvedValue(mockNPCs as never)

      const req = new NextRequest(
        "http://localhost:3000/api/npcs?page=1&limit=10",
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
      expect(npcRepo.getAllNPCs).toHaveBeenCalled()
    })

    it("calls getNPCsByZone when zoneId is provided", async () => {
      const zoneNPCs = mockNPCs.filter((n) => n.zoneId === "zone-1")
      vi.mocked(npcRepo.getNPCsByZone).mockResolvedValue(zoneNPCs as never)

      const req = new NextRequest(
        "http://localhost:3000/api/npcs?zoneId=zone-1",
        {
          method: "GET",
          headers: { Authorization: "Bearer test-token" },
        },
      )

      const response = await GET(req)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(npcRepo.getNPCsByZone).toHaveBeenCalledWith("zone-1")
    })
  })

  describe("POST /api/npcs", () => {
    it("creates NPC and calls audit log", async () => {
      const newNPC = {
        id: "npc-new-1",
        name: "New NPC",
        archetype: "warrior",
        personality: { traits: ["brave"] },
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      }
      vi.mocked(npcRepo.createNPC).mockResolvedValue(newNPC as never)

      const req = new NextRequest("http://localhost:3000/api/npcs", {
        method: "POST",
        headers: {
          Authorization: "Bearer test-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "New NPC",
          archetype: "warrior",
          personality: { traits: ["brave"] },
        }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data).toEqual(newNPC)
      expect(npcRepo.createNPC).toHaveBeenCalled()
      expect(createAuditLog).toHaveBeenCalledWith("create", "npc", "npc-new-1")
      expect(invalidateEntity).toHaveBeenCalledWith("npc", "npc-new-1")
    })
  })

  describe("GET /api/npcs/[id]", () => {
    it("returns single NPC when found", async () => {
      vi.mocked(npcRepo.getNPC).mockResolvedValue(mockNPCs[0] as never)

      const req = new NextRequest(
        "http://localhost:3000/api/npcs/npc-test-1",
        {
          method: "GET",
          headers: { Authorization: "Bearer test-token" },
        },
      )

      const response = await GET_BY_ID(req, { params: Promise.resolve({ id: "npc-test-1" }) })
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data.id).toBe("npc-test-1")
      expect(data.data.name).toBe("Test Warrior")
    })

    it("returns 404 when NPC not found", async () => {
      vi.mocked(npcRepo.getNPC).mockResolvedValue(null as never)

      const req = new NextRequest(
        "http://localhost:3000/api/npcs/nonexistent-id",
        {
          method: "GET",
          headers: { Authorization: "Bearer test-token" },
        },
      )

      const response = await GET_BY_ID(req, {
        params: Promise.resolve({ id: "nonexistent-id" }),
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe("NPC not found")
    })
  })

  describe("PUT /api/npcs/[id]", () => {
    it("updates NPC and calls audit log and cache invalidation", async () => {
      const updatedNPC = { ...mockNPCs[0], name: "Updated Warrior" }
      vi.mocked(npcRepo.getNPC).mockResolvedValue(mockNPCs[0] as never)
      vi.mocked(npcRepo.updateNPC).mockResolvedValue(updatedNPC as never)

      const req = new NextRequest(
        "http://localhost:3000/api/npcs/npc-test-1",
        {
          method: "PUT",
          headers: {
            Authorization: "Bearer test-token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: "Updated Warrior" }),
        },
      )

      const response = await PUT(req, { params: Promise.resolve({ id: "npc-test-1" }) })
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data.name).toBe("Updated Warrior")
      expect(npcRepo.updateNPC).toHaveBeenCalledWith("npc-test-1", {
        name: "Updated Warrior",
      })
      expect(createAuditLog).toHaveBeenCalledWith("update", "npc", "npc-test-1", {
        name: "Updated Warrior",
      })
      expect(invalidateEntity).toHaveBeenCalledWith("npc", "npc-test-1")
    })
  })

  describe("DELETE /api/npcs/[id]", () => {
    it("deletes NPC and calls audit log and cache invalidation", async () => {
      vi.mocked(npcRepo.getNPC).mockResolvedValue(mockNPCs[0] as never)
      vi.mocked(npcRepo.deleteNPC).mockResolvedValue(undefined as never)

      const req = new NextRequest(
        "http://localhost:3000/api/npcs/npc-test-1",
        {
          method: "DELETE",
          headers: { Authorization: "Bearer test-token" },
        },
      )

      const response = await DELETE(req, { params: Promise.resolve({ id: "npc-test-1" }) })
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(npcRepo.deleteNPC).toHaveBeenCalledWith("npc-test-1")
      expect(createAuditLog).toHaveBeenCalledWith(
        "delete",
        "npc",
        "npc-test-1",
      )
      expect(invalidateEntity).toHaveBeenCalledWith("npc", "npc-test-1")
    })
  })
})
