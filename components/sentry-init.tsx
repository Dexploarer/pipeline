"use client"

import { useEffect } from "react"

/**
 * Sentry Initialization Component
 * Initializes Sentry in a controlled React lifecycle
 * Only runs on the client side
 */
export function SentryInit(): null {
  useEffect(() => {
    // Dynamic import to avoid build-time dependency on @sentry/nextjs
    import("@/lib/monitoring/sentry")
      .then(({ initSentry }) => {
        initSentry()
      })
      .catch((error) => {
        // Silently fail if Sentry module is not available
        console.log("Sentry monitoring not available:", error.message)
      })
  }, [])

  return null
}
