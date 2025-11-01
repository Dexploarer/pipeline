import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// ============================================================================
// Configuration
// ============================================================================

const MAX_REQUEST_SIZE = 10 * 1024 * 1024 // 10MB default
const MAX_UPLOAD_SIZE = 50 * 1024 * 1024 // 50MB for file uploads

// ============================================================================
// Middleware
// ============================================================================

export function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname
  const pathname = request.nextUrl.pathname

  // Check if the hostname is a valid preview environment
  // Allow exact matches or valid subdomains of vusercontent.net and v0.app
  const isValidPreviewHost =
    hostname === "vusercontent.net" ||
    hostname.endsWith(".vusercontent.net") ||
    hostname === "v0.app" ||
    hostname.endsWith(".v0.app")

  // Handle OPTIONS preflight requests
  if (request.method === "OPTIONS") {
    const headers: Record<string, string> = {
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Max-Age": "86400",
    }

    if (isValidPreviewHost) {
      headers["Access-Control-Allow-Origin"] = "*"
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

  // Add CORS headers for valid preview environments
  if (isValidPreviewHost) {
    response.headers.set("Access-Control-Allow-Origin", "*")
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
