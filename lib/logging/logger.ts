/**
 * Centralized Logging System
 * Production-ready logging with structured output
 */

type LogLevel = "debug" | "info" | "warn" | "error"

interface LogContext {
  userId?: string
  requestId?: string
  method?: string
  url?: string
  duration?: number
  statusCode?: number
  [key: string]: unknown
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
    cause?: unknown
  }
}

class Logger {
  private static instance: Logger
  private isDevelopment: boolean

  private constructor() {
    this.isDevelopment = process.env["NODE_ENV"] !== "production"
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private formatEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    }

    if (context && Object.keys(context).length > 0) {
      entry.context = context
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
        cause: error.cause,
      }
    }

    return entry
  }

  private output(entry: LogEntry): void {
    const formatted = JSON.stringify(entry)

    switch (entry.level) {
      case "debug":
        console.debug(formatted)
        break
      case "info":
        console.info(formatted)
        break
      case "warn":
        console.warn(formatted)
        break
      case "error":
        console.error(formatted)
        break
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const entry = this.formatEntry("debug", message, context)
      this.output(entry)
    }
  }

  info(message: string, context?: LogContext): void {
    const entry = this.formatEntry("info", message, context)
    this.output(entry)
  }

  warn(message: string, context?: LogContext): void {
    const entry = this.formatEntry("warn", message, context)
    this.output(entry)
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const entry = this.formatEntry("error", message, context, error)
    this.output(entry)
  }

  // Specific domain loggers
  api = {
    request: (method: string, url: string, context?: LogContext): void => {
      this.info(`API Request: ${method} ${url}`, { method, url, ...context })
    },

    response: (method: string, url: string, statusCode: number, duration: number, context?: LogContext): void => {
      this.info(`API Response: ${method} ${url} ${statusCode}`, {
        method,
        url,
        statusCode,
        duration,
        ...context,
      })
    },

    error: (method: string, url: string, error: Error, context?: LogContext): void => {
      this.error(`API Error: ${method} ${url}`, error, { method, url, ...context })
    },
  }

  ai = {
    generation: (type: string, model: string, tokens: number, duration: number, context?: LogContext): void => {
      this.info(`AI Generation: ${type} via ${model}`, {
        type,
        model,
        tokens,
        duration,
        ...context,
      })
    },

    cacheHit: (key: string, context?: LogContext): void => {
      this.debug(`AI Cache Hit: ${key}`, { key, ...context })
    },

    cacheMiss: (key: string, context?: LogContext): void => {
      this.debug(`AI Cache Miss: ${key}`, { key, ...context })
    },

    error: (type: string, model: string, error: Error, context?: LogContext): void => {
      this.error(`AI Generation Error: ${type} via ${model}`, error, { type, model, ...context })
    },
  }

  db = {
    query: (operation: string, table: string, duration: number, context?: LogContext): void => {
      this.debug(`DB Query: ${operation} on ${table}`, {
        operation,
        table,
        duration,
        ...context,
      })
    },

    error: (operation: string, table: string, error: Error, context?: LogContext): void => {
      this.error(`DB Error: ${operation} on ${table}`, error, { operation, table, ...context })
    },
  }

  cache = {
    hit: (key: string, context?: LogContext): void => {
      this.debug(`Cache Hit: ${key}`, { key, ...context })
    },

    miss: (key: string, context?: LogContext): void => {
      this.debug(`Cache Miss: ${key}`, { key, ...context })
    },

    set: (key: string, ttl: number, context?: LogContext): void => {
      this.debug(`Cache Set: ${key} (TTL: ${ttl}s)`, { key, ttl, ...context })
    },

    error: (operation: string, key: string, error: Error, context?: LogContext): void => {
      this.error(`Cache Error: ${operation} on ${key}`, error, { operation, key, ...context })
    },
  }
}

export const logger = Logger.getInstance()

// ============================================================================
// Request ID Middleware Helper
// ============================================================================

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`
}

// ============================================================================
// Performance Tracking
// ============================================================================

export class PerformanceTracker {
  private startTime: number
  private checkpoints: Map<string, number>

  constructor() {
    this.startTime = Date.now()
    this.checkpoints = new Map()
  }

  checkpoint(name: string): void {
    this.checkpoints.set(name, Date.now() - this.startTime)
  }

  getCheckpoint(name: string): number | undefined {
    return this.checkpoints.get(name)
  }

  getDuration(): number {
    return Date.now() - this.startTime
  }

  getCheckpoints(): Record<string, number> {
    const result: Record<string, number> = {}
    this.checkpoints.forEach((duration, name) => {
      result[name] = duration
    })
    return result
  }

  log(message: string, context?: LogContext): void {
    logger.info(message, {
      duration: this.getDuration(),
      checkpoints: this.getCheckpoints(),
      ...context,
    })
  }
}

// ============================================================================
// Error Classes
// ============================================================================

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public context?: Record<string, unknown>
  ) {
    super(message)
    this.name = "AppError"
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public errors?: Array<{ field: string; message: string }>) {
    super(message, 400, "VALIDATION_ERROR", { errors })
    this.name = "ValidationError"
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with id ${id} not found` : `${resource} not found`,
      404,
      "NOT_FOUND",
      { resource, id }
    )
    this.name = "NotFoundError"
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "AUTHENTICATION_ERROR")
    this.name = "AuthenticationError"
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(message, 403, "AUTHORIZATION_ERROR")
    this.name = "AuthorizationError"
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Rate limit exceeded") {
    super(message, 429, "RATE_LIMIT_ERROR")
    this.name = "RateLimitError"
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super(`${service} error: ${message}`, 502, "EXTERNAL_SERVICE_ERROR", { service })
    this.name = "ExternalServiceError"
  }
}

// ============================================================================
// Error Handler
// ============================================================================

export function handleError(error: unknown, context?: LogContext): {
  statusCode: number
  message: string
  code?: string
  errors?: unknown
} {
  if (error instanceof AppError) {
    logger.error(error.message, error, { ...error.context, ...context })
    return {
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
      errors: error instanceof ValidationError ? error.errors : undefined,
    }
  }

  if (error instanceof Error) {
    logger.error(error.message, error, context)
    return {
      statusCode: 500,
      message: process.env["NODE_ENV"] === "production" ? "Internal server error" : error.message,
      code: "INTERNAL_ERROR",
    }
  }

  logger.error("Unknown error occurred", undefined, { error, ...context })
  return {
    statusCode: 500,
    message: "Internal server error",
    code: "UNKNOWN_ERROR",
  }
}
