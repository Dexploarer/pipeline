import { describe, it, expect } from "vitest"
import {
  generateNPCSchema,
  generateQuestLayerSchema,
  generateLoreSchema,
  createNPCSchema,
  validateRequest,
} from "../validation/schemas"

describe("Validation Schemas", () => {
  describe("generateNPCSchema", () => {
    it("should validate valid NPC generation request", () => {
      const validData = {
        prompt: "A grumpy blacksmith who lost his apprentice",
        archetype: "warrior",
        model: "gpt-4o-mini",
        priority: "quality",
      }

      const result = validateRequest(generateNPCSchema, validData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(expect.objectContaining(validData))
    })

    it("should reject prompt that is too short", () => {
      const invalidData = {
        prompt: "Short", // Less than 10 characters
        archetype: "merchant",
      }

      const result = validateRequest(generateNPCSchema, invalidData)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })

    it("should reject invalid archetype", () => {
      const invalidData = {
        prompt: "A mysterious traveler from distant lands",
        archetype: "invalid_archetype",
      }

      const result = validateRequest(generateNPCSchema, invalidData)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })

    it("should apply default values", () => {
      const minimalData = {
        prompt: "A friendly merchant selling exotic goods",
      }

      const result = validateRequest(generateNPCSchema, minimalData)

      expect(result.success).toBe(true)
      expect(result.data?.includeDialogue).toBe(true)
      expect(result.data?.includeQuests).toBe(true)
      expect(result.data?.priority).toBe("quality")
    })

    it("should limit related NPC IDs to 10", () => {
      const invalidData = {
        prompt: "A noble diplomat with many connections",
        relatedNpcIds: new Array(15).fill("550e8400-e29b-41d4-a716-446655440000"),
      }

      const result = validateRequest(generateNPCSchema, invalidData)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })
  })

  describe("generateQuestLayerSchema", () => {
    it("should validate valid quest layer generation request", () => {
      const validData = {
        questTitle: "The Lost Artifact",
        layerType: "gameflow",
      }

      const result = validateRequest(generateQuestLayerSchema, validData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(expect.objectContaining(validData))
    })

    it("should reject invalid layer type", () => {
      const invalidData = {
        questTitle: "The Lost Artifact",
        layerType: "invalid_layer",
      }

      const result = validateRequest(generateQuestLayerSchema, invalidData)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })

    it("should accept all valid layer types", () => {
      const layerTypes = [
        "gameflow",
        "lore",
        "history",
        "relationships",
        "economy",
        "world-events",
      ]

      layerTypes.forEach((layerType) => {
        const data = {
          questTitle: "Test Quest",
          layerType,
        }

        const result = validateRequest(generateQuestLayerSchema, data)
        expect(result.success).toBe(true)
      })
    })
  })

  describe("generateLoreSchema", () => {
    it("should validate valid lore generation request", () => {
      const validData = {
        prompt: "The ancient history of the dragon wars",
        category: "history",
      }

      const result = validateRequest(generateLoreSchema, validData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(expect.objectContaining(validData))
    })

    it("should accept all valid lore categories", () => {
      const categories = [
        "history",
        "culture",
        "geography",
        "magic",
        "religion",
        "politics",
        "economy",
        "legend",
        "bestiary",
      ]

      categories.forEach((category) => {
        const data = {
          prompt: `Test lore for ${category}`,
          category,
        }

        const result = validateRequest(generateLoreSchema, data)
        expect(result.success).toBe(true)
      })
    })
  })

  describe("createNPCSchema", () => {
    it("should validate valid NPC creation data", () => {
      const validData = {
        name: "Thorin Ironforge",
        archetype: "warrior",
        personality: {
          traits: ["brave", "loyal"],
          goals: ["Protect the kingdom"],
        },
        spawnPoint: {
          x: 100,
          y: 200,
          z: 0,
          rotation: 90,
        },
      }

      const result = validateRequest(createNPCSchema, validData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(expect.objectContaining(validData))
    })

    it("should reject empty name", () => {
      const invalidData = {
        name: "",
        archetype: "merchant",
        personality: {},
      }

      const result = validateRequest(createNPCSchema, invalidData)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })

    it("should reject name longer than 255 characters", () => {
      const invalidData = {
        name: "A".repeat(256),
        archetype: "merchant",
        personality: {},
      }

      const result = validateRequest(createNPCSchema, invalidData)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })
  })
})
