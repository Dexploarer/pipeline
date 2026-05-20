/**
 * Sentry Error Monitoring Setup
 * Captures and tracks errors in production.
 *
 * `@sentry/nextjs` is an OPTIONAL dependency. It is loaded dynamically so the
 * application builds and runs without it. Install it with
 * `bun add @sentry/nextjs` and set SENTRY_DSN to enable error monitoring.
 */

let sentryInitialized = false

export interface SentryConfig {
  dsn?: string
  environment?: string
  tracesSampleRate?: number
  enabled?: boolean
}

/**
 * Dynamically load the optional `@sentry/nextjs` module.
 * Returns `null` when the package is not installed.
 */
async function loadSentry() {
  try {
    // A non-literal specifier keeps this import optional at type-check time.
    const moduleName: string = "@sentry/nextjs"
    return await import(moduleName)
  } catch {
    return null
  }
}

/**
 * Initialize Sentry error monitoring.
 * Only initializes once and only when enabled with a DSN configured.
 */
export function initSentry(config?: SentryConfig): void {
  // Skip if already initialized
  if (sentryInitialized) {
    return
  }

  const dsn = config?.dsn ?? process.env["SENTRY_DSN"]
  const environment = config?.environment ?? process.env["NODE_ENV"] ?? "development"
  const enabled = config?.enabled ?? process.env["NODE_ENV"] === "production"

  // Skip in development or if no DSN
  if (!enabled || !dsn) {
    console.log("Sentry monitoring disabled")
    return
  }

  void loadSentry()
    .then((Sentry) => {
      if (!Sentry) {
        console.log("Sentry monitoring not available - @sentry/nextjs is not installed")
        return
      }

      Sentry.init({
        dsn,
        environment,

        // Performance monitoring - 10% of transactions
        tracesSampleRate: config?.tracesSampleRate ?? 0.1,

        // Error filtering
        beforeSend(event: unknown, hint: { originalException?: unknown }): unknown {
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
        integrations: [Sentry.httpIntegration(), Sentry.browserTracingIntegration()],

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
    .catch((error) => {
      console.error("Failed to initialize Sentry:", error)
    })
}

/**
 * Capture an exception manually
 */
export async function captureException(
  error: Error,
  context?: Record<string, unknown>,
): Promise<void> {
  if (!sentryInitialized) {
    return
  }

  try {
    const Sentry = await loadSentry()
    Sentry?.captureException(error, { extra: context })
  } catch (err) {
    console.error("Failed to capture exception:", err)
  }
}

/**
 * Capture a message manually
 */
export async function captureMessage(
  message: string,
  level: "fatal" | "error" | "warning" | "log" | "info" | "debug" = "info",
): Promise<void> {
  if (!sentryInitialized) {
    return
  }

  try {
    const Sentry = await loadSentry()
    Sentry?.captureMessage(message, level)
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
    const Sentry = await loadSentry()
    Sentry?.setUser({
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
  data?: Record<string, unknown>,
): Promise<void> {
  if (!sentryInitialized) {
    return
  }

  try {
    const Sentry = await loadSentry()
    Sentry?.addBreadcrumb({
      message,
      data,
      timestamp: Date.now() / 1000,
    })
  } catch (error) {
    console.error("Failed to add breadcrumb:", error)
  }
}
