import { expect, afterEach } from "vitest"
import { cleanup } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"

// Cleanup after each test case
afterEach(() => {
  cleanup()
})

// Mock environment variables for tests
// Note: Use .env.test file for actual test configuration
// These are safe placeholder values that don't expose real credentials
process.env["NODE_ENV"] = "test"
process.env["DATABASE_URL"] = process.env["DATABASE_URL"] || "postgresql://localhost:5432/test_db"
process.env["OPENAI_API_KEY"] = process.env["OPENAI_API_KEY"] || "test-key-placeholder"
