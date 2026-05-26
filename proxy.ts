import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// ============================================================================
// Configuration
// ============================================================================

const MAX_REQUEST_SIZE = 10 * 1024 * 1024 // 10MB default
const MAX_UPLOAD_SIZE = 50 * 1024 * 1024 // 50MB for file uploads

// ============================================================================
// Origin Validation
// ============================================================================

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false
  try {
    const url = new URL(origin)
    const hostname = url.hostname
    return (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "vusercontent.net" ||
      hostname.endsWith(".vusercontent.net") ||
      hostname === "v0.app" ||
      hostname.endsWith(".v0.app")
    )
  } catch {
    return false
  }
}

// ============================================================================
// Middleware
// ============================================================================

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const origin = request.headers.get("origin")

  // Handle OPTIONS preflight requests
  if (request.method === "OPTIONS") {
    const headers: Record<string, string> = {
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Max-Age": "86400",
    }

    if (origin && isAllowedOrigin(origin)) {
      headers["Access-Control-Allow-Origin"] = origin
      headers["Access-Control-Allow-Credentials"] = "true"
    }

    return new NextResponse(null, {
      status: 204,
      headers,
    })
  }

  // Check request size for POST/PUT/PATCH requests
  if (["POST", "PUT", "PATCH"].includes(request.method)) {
    const contentLength = request.headers.get("content-length")

    if (contentLength) {
      const size = parseInt(contentLength, 10)

      // Different limits for upload endpoints
      const isUploadEndpoint = pathname.includes("/upload") || pathname.includes("/asset")
      const maxSize = isUploadEndpoint ? MAX_UPLOAD_SIZE : MAX_REQUEST_SIZE

      if (size > maxSize) {
        return NextResponse.json(
          {
            error: "Request body too large",
            maxSize: maxSize / (1024 * 1024) + "MB",
            receivedSize: (size / (1024 * 1024)).toFixed(2) + "MB",
          },
          { status: 413 }
        )
      }
    }
  }

  // Handle regular requests
  const response = NextResponse.next()

  // Add security headers
  response.headers.set("X-Request-ID", crypto.randomUUID())

  // Add CORS headers for valid origins
  if (origin && isAllowedOrigin(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin)
    response.headers.set("Access-Control-Allow-Credentials", "true")
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
  }

  return response
}

export const config = {
  matcher: [
    "/api/:path*",
    // Also apply to other sensitive routes if needed
    // "/admin/:path*",
  ],
}
