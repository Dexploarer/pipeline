/**
 * Client-side Error Handler
 * Provides better error messages and handling for API errors
 */

export interface ApiError {
  message: string
  code?: string
  errors?: Array<{ field: string; message: string }>
  statusCode: number
}

export class AppError extends Error {
  code?: string
  statusCode: number
  errors?: Array<{ field: string; message: string }>

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message)
    this.name = "AppError"
    this.statusCode = statusCode
    this.code = code
  }
}

/**
 * Parse error from API response
 */
export async function parseApiError(response: Response): Promise<ApiError> {
  let errorData: any

  try {
    errorData = await response.json()
  } catch {
    // If response is not JSON, use status text
    errorData = {
      message: response.statusText || "An error occurred",
      statusCode: response.status,
    }
  }

  return {
    message: errorData.error || errorData.message || "An unexpected error occurred",
    code: errorData.code,
    errors: errorData.errors,
    statusCode: response.status,
  }
}

/**
 * Get user-friendly error message based on error type
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  // Network errors
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return "Network error. Please check your internet connection and try again."
  }

  // API errors
  if (error instanceof AppError) {
    return error.message
  }

  // Response errors
  if (error && typeof error === "object" && "message" in error) {
    const apiError = error as ApiError

    switch (apiError.statusCode) {
      case 400:
        return apiError.message || "Invalid request. Please check your input and try again."
      case 401:
        return "You need to be logged in to perform this action."
      case 403:
        return "You don't have permission to perform this action."
      case 404:
        return "The requested resource was not found."
      case 413:
        return apiError.message || "Request is too large. Please reduce the size and try again."
      case 429:
        return "Too many requests. Please wait a moment and try again."
      case 500:
        return "Server error. Our team has been notified. Please try again later."
      case 503:
        return "Service temporarily unavailable. Please try again in a few moments."
      default:
        return apiError.message || "An unexpected error occurred. Please try again."
    }
  }

  // Generic error
  if (error instanceof Error) {
    return error.message
  }

  return "An unexpected error occurred. Please try again."
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(
  errors: Array<{ field: string; message: string }>
): string {
  if (errors.length === 0) {
    return ""
  }

  if (errors.length === 1) {
    return errors[0]?.message || ""
  }

  return `Multiple errors:\n${errors.map((e) => `• ${e.field}: ${e.message}`).join("\n")}`
}

/**
 * Handle API call with proper error handling
 */
export async function handleApiCall<T>(
  apiCall: () => Promise<Response>,
  options?: {
    onSuccess?: (data: T) => void
    onError?: (error: ApiError) => void
    successMessage?: string
  }
): Promise<{ success: boolean; data?: T; error?: ApiError }> {
  try {
    const response = await apiCall()

    if (!response.ok) {
      const error = await parseApiError(response)

      if (options?.onError) {
        options.onError(error)
      }

      return { success: false, error }
    }

    const data = await response.json()

    if (options?.onSuccess) {
      options.onSuccess(data)
    }

    return { success: true, data }
  } catch (error) {
    const apiError: ApiError = {
      message: getUserFriendlyErrorMessage(error),
      statusCode: 0,
    }

    if (options?.onError) {
      options.onError(apiError)
    }

    return { success: false, error: apiError }
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (error && typeof error === "object" && "statusCode" in error) {
        const statusCode = (error as ApiError).statusCode
        if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
          throw error
        }
      }

      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}
