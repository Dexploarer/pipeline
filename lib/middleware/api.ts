/**
 * API Middleware
 * Request/response interceptors for logging, validation, and error handling
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { logger, generateRequestId, PerformanceTracker, handleError, ValidationError } from "../logging/logger"
import { validateRequest, formatValidationErrors } from "../validation/schemas"

// ============================================================================
// Types
// ============================================================================

export type ApiHandler = (
  req: NextRequest,
  context: ApiContext
) => Promise<NextResponse> | NextResponse

export interface ApiContext {
  requestId: string
  userId?: string
  params?: Record<string, string>
  tracker: PerformanceTracker
}

export interface MiddlewareOptions {
  validation?: {
    body?: z.ZodType<any>
    query?: z.ZodType<any>
    params?: z.ZodType<any>
  }
  auth?: boolean
  rateLimit?: {
    requests: number
    window: number // seconds
  }
}

// ============================================================================
// Main Wrapper
// ============================================================================

export function createApiHandler(
  handler: ApiHandler,
  options: MiddlewareOptions = {}
): (req: NextRequest, context?: { params?: Record<string, string> }) => Promise<NextResponse> {
  return async (req: NextRequest, context?: { params?: Record<string, string> }) => {
    const requestId = generateRequestId()
    const tracker = new PerformanceTracker()
    const method = req.method
    const url = req.url

    // Log incoming request
    logger.api.request(method, url, { requestId })

    try {
      // Create API context
      const apiContext: ApiContext = {
        requestId,
        params: context?.params,
        tracker,
      }

      tracker.checkpoint("request_start")

      // Validation
      if (options.validation) {
        const validationResult = await validateRequestData(req, options.validation, context?.params)
        if (!validationResult.success) {
          throw validationResult.error
        }
        tracker.checkpoint("validation_complete")
      }

      // Authentication (placeholder - integrate with your auth system)
      if (options.auth) {
        const userId = await authenticate(req)
        if (!userId) {
          return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
          )
        }
        apiContext.userId = userId
        tracker.checkpoint("auth_complete")
      }

      // Rate limiting (placeholder - integrate with your rate limit system)
      if (options.rateLimit) {
        const allowed = await checkRateLimit(req, options.rateLimit)
        if (!allowed) {
          return NextResponse.json(
            { error: "Rate limit exceeded" },
            { status: 429 }
          )
        }
        tracker.checkpoint("rateLimit_complete")
      }

      // Execute handler
      const response = await handler(req, apiContext)

      tracker.checkpoint("handler_complete")

      // Log successful response
      logger.api.response(method, url, response.status, tracker.getDuration(), {
        requestId,
        userId: apiContext.userId,
      })

      // Add request ID to response headers
      response.headers.set("X-Request-ID", requestId)

      return response

    } catch (error) {
      // Log error
      logger.api.error(method, url, error as Error, { requestId })

      // Handle and format error
      const errorResponse = handleError(error, { requestId, method, url })

      return NextResponse.json(
        {
          error: errorResponse.message,
          code: errorResponse.code,
          errors: errorResponse.errors,
          requestId,
        },
        { status: errorResponse.statusCode }
      )
    }
  }
}

// ============================================================================
// Validation Helper
// ============================================================================

async function validateRequestData(
  req: NextRequest,
  validation: MiddlewareOptions["validation"],
  params?: Record<string, string>
): Promise<{ success: boolean; error?: ValidationError }> {
  try {
    // Validate body
    if (validation?.body && req.method !== "GET" && req.method !== "DELETE") {
      const body = await req.json().catch(() => ({}))
      const result = validateRequest(validation.body, body)
      if (!result.success && result.errors) {
        return {
          success: false,
          error: new ValidationError("Invalid request body", formatValidationErrors(result.errors)),
        }
      }
    }

    // Validate query parameters
    if (validation?.query) {
      const { searchParams } = new URL(req.url)
      const query = Object.fromEntries(searchParams.entries())
      const result = validateRequest(validation.query, query)
      if (!result.success && result.errors) {
        return {
          success: false,
          error: new ValidationError("Invalid query parameters", formatValidationErrors(result.errors)),
        }
      }
    }

    // Validate URL parameters
    if (validation?.params && params) {
      const result = validateRequest(validation.params, params)
      if (!result.success && result.errors) {
        return {
          success: false,
          error: new ValidationError("Invalid URL parameters", formatValidationErrors(result.errors)),
        }
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: new ValidationError("Request validation failed"),
    }
  }
}

// ============================================================================
// Authentication Placeholder
// ============================================================================

async function authenticate(req: NextRequest): Promise<string | null> {
  // TODO: Implement actual authentication
  // This is a placeholder - integrate with Auth0, Supabase, NextAuth, etc.

  const authHeader = req.headers.get("authorization")
  if (!authHeader) {
    return null
  }

  // For now, just extract from Bearer token
  // In production, verify the token signature and extract user ID
  const token = authHeader.replace("Bearer ", "")
  if (!token) {
    return null
  }

  // Placeholder: return mock user ID
  return "user_" + token.substring(0, 8)
}

// ============================================================================
// Rate Limiting Placeholder
// ============================================================================

async function checkRateLimit(
  _req: NextRequest,
  _config: { requests: number; window: number }
): Promise<boolean> {
  // TODO: Implement actual rate limiting with Redis
  // This is a placeholder

  // Example implementation would be:
  // const identifier = req.headers.get("x-forwarded-for") || "anonymous"
  // return await checkRateLimit(identifier, config.requests, config.window)

  return true // Allow all requests for now
}

// ============================================================================
// Response Helpers
// ============================================================================

export function jsonResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status })
}

export function successResponse<T>(data: T, message?: string): NextResponse {
  return jsonResponse({
    success: true,
    data,
    ...(message && { message }),
  })
}

export function errorResponse(message: string, code?: string, status: number = 400): NextResponse {
  return jsonResponse(
    {
      success: false,
      error: message,
      ...(code && { code }),
    },
    status
  )
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): NextResponse {
  return jsonResponse({
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
}

// ============================================================================
// Pagination Helper
// ============================================================================

export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

export function getPaginationParams(req: NextRequest): PaginationParams {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")))
  const offset = (page - 1) * limit

  return { page, limit, offset }
}

// ============================================================================
// CORS Helper
// ============================================================================

export function corsHeaders(origin?: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
  }
}

export function handleCors(req: NextRequest): NextResponse | null {
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(req.headers.get("origin") ?? undefined),
    })
  }
  return null
}
