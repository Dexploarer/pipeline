import { expect, afterEach } from "vitest"
import { cleanup } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"

// Cleanup after each test case
afterEach(() => {
  cleanup()
})

// Mock environment variables for tests
process.env["NODE_ENV"] = "test"
process.env["DATABASE_URL"] = "postgresql://test:test@localhost:5432/test"
process.env["OPENAI_API_KEY"] = "test-key"
