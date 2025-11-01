/**
 * Sentry Error Monitoring Setup
 * Captures and tracks errors in production
 */

// Note: Install @sentry/nextjs with: bun add @sentry/nextjs

let sentryInitialized = false

export interface SentryConfig {
  dsn?: string
  environment?: string
  tracesSampleRate?: number
  enabled?: boolean
}

/**
 * Initialize Sentry error monitoring
 * Only initializes once and only in production
 */
export function initSentry(config?: SentryConfig): void {
  // Skip if already initialized
  if (sentryInitialized) {
    return
  }

  const dsn = config?.dsn || process.env["SENTRY_DSN"]
  const environment = config?.environment || process.env["NODE_ENV"] || "development"
  const enabled = config?.enabled ?? process.env["NODE_ENV"] === "production"

  // Skip in development or if no DSN
  if (!enabled || !dsn) {
    console.log("Sentry monitoring disabled")
    return
  }

  try {
    // Dynamic import to avoid bundling Sentry in environments where it's not needed
    import("@sentry/nextjs").then((Sentry) => {
      Sentry.init({
        dsn,
        environment,

        // Performance monitoring
        tracesSampleRate: config?.tracesSampleRate || 0.1, // 10% of transactions

        // Error filtering
        beforeSend(event, hint) {
          // Filter out errors we don't care about
          const error = hint.originalException

          // Ignore network errors that are expected
          if (error && typeof error === "object" && "message" in error) {
            const message = (error as Error).message

            // Ignore CORS errors from browser extensions
            if (message.includes("CORS") && message.includes("extension")) {
              return null
            }

            // Ignore cancelled requests
            if (message.includes("aborted") || message.includes("cancelled")) {
              return null
            }
          }

          return event
        },

        // Integrations
        integrations: [
          Sentry.httpIntegration(),
          Sentry.browserTracingIntegration(),
        ],

        // Release tracking (automatically set by Vercel)
        release: process.env["VERCEL_GIT_COMMIT_SHA"],

        // PII filtering
        sendDefaultPii: false,

        // Debug mode
        debug: false,
      })

      sentryInitialized = true
      console.log("Sentry monitoring initialized")
    })
  } catch (error) {
    console.error("Failed to initialize Sentry:", error)
  }
}

/**
 * Capture an exception manually
 */
export async function captureException(error: Error, context?: Record<string, any>): Promise<void> {
  if (!sentryInitialized) {
    return
  }

  try {
    const Sentry = await import("@sentry/nextjs")

    Sentry.captureException(error, {
      extra: context,
    })
  } catch (err) {
    console.error("Failed to capture exception:", err)
  }
}

/**
 * Capture a message manually
 */
export async function captureMessage(
  message: string,
  level: "fatal" | "error" | "warning" | "log" | "info" | "debug" = "info"
): Promise<void> {
  if (!sentryInitialized) {
    return
  }

  try {
    const Sentry = await import("@sentry/nextjs")

    Sentry.captureMessage(message, level)
  } catch (error) {
    console.error("Failed to capture message:", error)
  }
}

/**
 * Set user context for error tracking
 */
export async function setUserContext(user: {
  id: string
  email?: string
  username?: string
}): Promise<void> {
  if (!sentryInitialized) {
    return
  }

  try {
    const Sentry = await import("@sentry/nextjs")

    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    })
  } catch (error) {
    console.error("Failed to set user context:", error)
  }
}

/**
 * Add breadcrumb for debugging
 */
export async function addBreadcrumb(
  message: string,
  data?: Record<string, any>
): Promise<void> {
  if (!sentryInitialized) {
    return
  }

  try {
    const Sentry = await import("@sentry/nextjs")

    Sentry.addBreadcrumb({
      message,
      data,
      timestamp: Date.now() / 1000,
    })
  } catch (error) {
    console.error("Failed to add breadcrumb:", error)
  }
}

/**
 * Start a transaction for performance monitoring
 */
export async function startTransaction(
  name: string,
  op: string = "http.server"
): Promise<any> {
  if (!sentryInitialized) {
    return null
  }

  try {
    const Sentry = await import("@sentry/nextjs")

    return Sentry.startTransaction({
      name,
      op,
    })
  } catch (error) {
    console.error("Failed to start transaction:", error)
    return null
  }
}
