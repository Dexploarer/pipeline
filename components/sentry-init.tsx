"use client"

import { useEffect } from "react"
import { initSentry } from "@/lib/monitoring/sentry"

/**
 * Sentry Initialization Component
 * Initializes Sentry in a controlled React lifecycle
 * Only runs on the client side
 */
export function SentryInit(): null {
  useEffect(() => {
    // Initialize Sentry only once on client mount
    initSentry()
  }, [])

  return null
}
