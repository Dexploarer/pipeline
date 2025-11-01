import { describe, it, expect } from "vitest"
import { cn } from "../utils"

describe("Utility Functions", () => {
  describe("cn (className merger)", () => {
    it("should merge class names correctly", () => {
      const result = cn("foo", "bar")
      expect(result).toBe("foo bar")
    })

    it("should handle conditional classes", () => {
      const result = cn("foo", false && "bar", "baz")
      expect(result).toBe("foo baz")
    })

    it("should merge Tailwind classes correctly", () => {
      const result = cn("px-2 py-1", "px-4")
      // tailwind-merge should keep only px-4
      expect(result).toBe("py-1 px-4")
    })

    it("should handle empty inputs", () => {
      const result = cn()
      expect(result).toBe("")
    })

    it("should handle null and undefined", () => {
      const result = cn("foo", null, undefined, "bar")
      expect(result).toBe("foo bar")
    })

    it("should handle arrays", () => {
      const result = cn(["foo", "bar"], "baz")
      expect(result).toBe("foo bar baz")
    })

    it("should handle complex conditional logic", () => {
      const isActive = true
      const isDisabled = false

      const result = cn(
        "base-class",
        isActive && "active-class",
        isDisabled && "disabled-class",
        !isDisabled && "enabled-class"
      )

      expect(result).toContain("base-class")
      expect(result).toContain("active-class")
      expect(result).toContain("enabled-class")
      expect(result).not.toContain("disabled-class")
    })
  })
})
