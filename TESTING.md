# Testing Guide

This project uses **Vitest** for unit and integration testing.

## Setup

Install dependencies:

```bash
bun install
```

## Running Tests

```bash
# Run tests in watch mode (recommended during development)
bun test

# Run tests once
bun test:run

# Run tests with UI
bun test:ui

# Run tests with coverage
bun test:coverage
```

## Test Structure

Tests are located in `__tests__` directories next to the code they test:

```
lib/
  validation/
    schemas.ts
  __tests__/
    validation.test.ts
    utils.test.ts
components/
  __tests__/
    npc-generator.test.tsx
```

## Writing Tests

### Unit Tests

```typescript
import { describe, it, expect } from "vitest"
import { myFunction } from "../my-module"

describe("myFunction", () => {
  it("should do something", () => {
    const result = myFunction("input")
    expect(result).toBe("expected output")
  })
})
```

### Component Tests

```typescript
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { MyComponent } from "../my-component"

describe("MyComponent", () => {
  it("should render correctly", () => {
    render(<MyComponent />)
    expect(screen.getByText("Hello")).toBeInTheDocument()
  })
})
```

### API Route Tests

```typescript
import { describe, it, expect } from "vitest"
import { POST } from "../route"

describe("POST /api/generate-npc", () => {
  it("should generate NPC", async () => {
    const request = new Request("http://localhost/api/generate-npc", {
      method: "POST",
      body: JSON.stringify({ prompt: "test", archetype: "warrior" }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty("id")
  })
})
```

## Coverage Goals

- **Target:** 60% overall coverage
- **Critical paths:** 80%+ coverage (validation, authentication, core business logic)
- **UI components:** 40%+ coverage

## Continuous Integration

Tests run automatically on:
- Pull requests
- Pushes to main branch

## Mocking

### Environment Variables

```typescript
import { beforeEach, afterEach } from "vitest"

beforeEach(() => {
  process.env["TEST_VAR"] = "value"
})

afterEach(() => {
  delete process.env["TEST_VAR"]
})
```

### External APIs

```typescript
import { vi } from "vitest"

vi.mock("@/lib/ai-router", () => ({
  generateText: vi.fn().mockResolvedValue({ text: "mocked response" }),
}))
```

## Best Practices

1. **Test behavior, not implementation** - Focus on what the code does, not how it does it
2. **Keep tests simple** - One assertion per test when possible
3. **Use descriptive test names** - "should do X when Y happens"
4. **Avoid test interdependence** - Each test should run independently
5. **Mock external dependencies** - Don't make real API calls or database queries in tests
6. **Test edge cases** - Empty inputs, null values, error conditions
7. **Use test fixtures** - Create reusable test data

## Debugging Tests

```bash
# Run a specific test file
bun test validation.test.ts

# Run tests matching a pattern
bun test -t "should validate"

# Run with verbose output
bun test --reporter=verbose
```

## Common Issues

### Test Timeout

Increase timeout for slow tests:

```typescript
it("slow test", async () => {
  // ...
}, 10000) // 10 second timeout
```

### Module Not Found

Make sure path aliases are configured in `vitest.config.ts`:

```typescript
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./"),
  },
}
```
