import { StackServerApp } from "@stackframe/stack"
import { logger } from "@/lib/logging/logger"

export interface User {
  id: string
  email: string
  name?: string
  role?: "admin" | "creator" | "viewer"
  createdAt: Date
}

// ============================================================================
// Stack Auth Configuration
// ============================================================================

let stackServerApp: StackServerApp | null = null

function getStackApp(): StackServerApp | null {
  if (stackServerApp) {
    return stackServerApp
  }

  const projectId = process.env["STACK_PROJECT_ID"]
  const secretKey = process.env["STACK_SECRET_SERVER_KEY"]

  if (!projectId || !secretKey) {
    logger.warn("Stack Auth not configured - authentication disabled")
    return null
  }

  try {
    stackServerApp = new StackServerApp({
      tokenStore: "nextjs-cookie",
    })
    return stackServerApp
  } catch (error) {
    logger.error("Failed to initialize Stack Auth", error as Error)
    return null
  }
}

// ============================================================================
// Development Mode User
// ============================================================================

const DEV_USER: User = {
  id: "user_dev_00000000",
  email: "dev@localhost",
  name: "Development User",
  role: "admin",
  createdAt: new Date(),
}

// ============================================================================
// User Management Functions
// ============================================================================

/**
 * Get the currently authenticated user
 * Returns development user in dev mode, or fetches from Stack Auth in production
 */
export async function getCurrentUser(): Promise<User | null> {
  // Development mode: return mock user (only in non-production environments)
  if (process.env["NODE_ENV"] === "development" && process.env["VERCEL_ENV"] !== "production") {
    return DEV_USER
  }

  const stackApp = getStackApp()
  if (!stackApp) {
    return null
  }

  try {
    const stackUser = await stackApp.getUser()

    if (!stackUser) {
      return null
    }

    // Fetch role from Stack Auth metadata, default to least privileged role
    const role = (stackUser.serverMetadata?.role || stackUser.clientMetadata?.role) as User["role"]

    return {
      id: stackUser.id,
      email: stackUser.primaryEmail || "",
      name: stackUser.displayName || undefined,
      role: role || "viewer", // Default to least privileged role for security
      createdAt: new Date(stackUser.createdAt || Date.now()),
    }
  } catch (error) {
    logger.error("Failed to get current user from Stack Auth", error as Error)
    return null
  }
}

/**
 * Check if a user is currently authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

/**
 * Get the current user's ID
 * Returns "anonymous" if not authenticated
 */
export async function getUserId(): Promise<string> {
  const user = await getCurrentUser()
  return user?.id || "anonymous"
}

/**
 * Get user from request headers (for API routes)
 * Validates Bearer token and returns user info
 */
export async function getUserFromRequest(authHeader: string | null): Promise<User | null> {
  if (!authHeader) {
    return null
  }

  // Development mode: accept any Bearer token (only in non-production environments)
  if (process.env["NODE_ENV"] === "development" && process.env["VERCEL_ENV"] !== "production") {
    if (authHeader.startsWith("Bearer ")) {
      return DEV_USER
    }
    return null
  }

  const stackApp = getStackApp()
  if (!stackApp) {
    return null
  }

  try {
    // Extract token from "Bearer <token>"
    const token = authHeader.replace("Bearer ", "")
    if (!token) {
      return null
    }

    // Verify token with Stack Auth
    const stackUser = await stackApp.getUser({ accessToken: token })
    if (!stackUser) {
      return null
    }

    // Fetch role from Stack Auth metadata, default to least privileged role
    const role = (stackUser.serverMetadata?.role || stackUser.clientMetadata?.role) as User["role"]

    return {
      id: stackUser.id,
      email: stackUser.primaryEmail || "",
      name: stackUser.displayName || undefined,
      role: role || "viewer", // Default to least privileged role for security
      createdAt: new Date(stackUser.createdAt || Date.now()),
    }
  } catch (error) {
    logger.error("Failed to verify user token", error as Error)
    return null
  }
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}

/**
 * Check if user has required role
 */
export function hasRole(user: User, requiredRole: User["role"]): boolean {
  if (!user.role) {
    return false
  }

  const roleHierarchy: Record<string, number> = {
    viewer: 1,
    creator: 2,
    admin: 3,
  }

  const userLevel = roleHierarchy[user.role] || 0
  const requiredLevel = roleHierarchy[requiredRole || "viewer"] || 0

  return userLevel >= requiredLevel
}
