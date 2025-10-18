import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// CORS middleware - sets Access-Control headers for preview environments
export function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname

  // Check if the hostname is a valid preview environment
  // Allow exact matches or valid subdomains of vusercontent.net and v0.app
  const isValidPreviewHost =
    hostname === "vusercontent.net" ||
    hostname.endsWith(".vusercontent.net") ||
    hostname === "v0.app" ||
    hostname.endsWith(".v0.app")

  // Handle OPTIONS preflight requests
  if (request.method === "OPTIONS" && isValidPreviewHost) {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    })
  }

  // Handle regular requests
  const response = NextResponse.next()

  // Add CORS headers for valid preview environments
  if (isValidPreviewHost) {
    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  }

  return response
}

export const config = {
  matcher: ["/api/:path*"],
}
