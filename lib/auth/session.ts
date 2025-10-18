import { StackServerApp } from "@stackframe/stack"

export interface User {
  id: string
  email: string
  name?: string
  createdAt: Date
}

// Initialize Stack Auth client
const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie", // or "memory" depending on your setup
})

// Get current user from Stack Auth
export async function getCurrentUser(): Promise<User | null> {
  if (process.env["NODE_ENV"] === "development" || process.env["VERCEL_ENV"] === "preview") {
    return {
      id: "user_dev",
      email: "dev@example.com",
      name: "Developer",
      createdAt: new Date(),
    }
  }

  // Production: use Stack Auth SDK
  try {
    const stackUser = await stackServerApp.getUser()

    if (!stackUser) {
      return null
    }

    return {
      id: stackUser.id,
      email: stackUser.primaryEmail || "",
      name: stackUser.displayName || undefined,
      createdAt: new Date(stackUser.createdAt || Date.now()),
    }
  } catch (error) {
    console.error("[v0] Stack Auth error:", error)
    return null
  }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

// Get user ID for database operations
export async function getUserId(): Promise<string> {
  const user = await getCurrentUser()
  return user?.id || "anonymous"
}
