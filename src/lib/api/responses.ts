import { NextResponse } from 'next/server'

interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}

interface ApiErrorResponse {
  success: false
  error: string
  details?: any
}

interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  totalPages: number
  hasMore: boolean
}

export function apiSuccess<T>(
  data: T,
  message?: string,
  status = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  )
}

export function apiError(
  error: string,
  status: number,
  details?: any
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details && { details }),
    },
    { status }
  )
}

export function apiPaginated<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
  message?: string
): NextResponse<ApiSuccessResponse<PaginatedData<T>>> {
  const totalPages = Math.ceil(total / limit)
  return apiSuccess(
    {
      items,
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    },
    message
  )
}

// Common error responses
export const unauthorized = (message = 'Unauthorized') =>
  apiError(message, 401)

export const forbidden = (message = 'Forbidden - Insufficient permissions') =>
  apiError(message, 403)

export const notFound = (resource = 'Resource') =>
  apiError(`${resource} not found`, 404)

export const badRequest = (message: string, details?: any) =>
  apiError(message, 400, details)

export const serverError = (message = 'Internal server error', details?: any) =>
  apiError(message, 500, details)

export const rateLimited = (resetTime?: Date) =>
  apiError(
    resetTime
      ? `Rate limit exceeded. Try again at ${resetTime.toLocaleTimeString()}`
      : 'Rate limit exceeded',
    429,
    resetTime ? { resetTime: resetTime.toISOString() } : undefined
  )

// Helper to handle async route errors
export async function handleRouteError(
  fn: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await fn()
  } catch (error) {
    console.error('Route handler error:', error)
    
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('not found')) {
        return notFound()
      }
      if (error.message.includes('unauthorized')) {
        return unauthorized()
      }
      if (error.message.includes('validation')) {
        return badRequest(error.message)
      }
    }
    
    return serverError()
  }
}