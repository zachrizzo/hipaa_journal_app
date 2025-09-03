/**
 * Centralized API client with consistent patterns
 * Handles authentication, error handling, and response formatting
 */

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

class ApiClient {
  private baseURL: string
  private defaultTimeout: number = 30000 // 30 seconds default timeout

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || ''
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries: number = 3
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.defaultTimeout)

    try {
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      })

      clearTimeout(timeout)
      const data = await response.json()

      if (!response.ok) {
        throw new ApiError(data.error || 'Request failed', response.status, data)
      }

      return data
    } catch (error) {
      clearTimeout(timeout)
      
      if (error instanceof ApiError) {
        throw error
      }

      // Handle timeout error
      if ((error as Error).name === 'AbortError') {
        if (retries > 0) {
          console.warn(`Request timed out, retrying... (${retries} retries left)`)
          return this.request<T>(endpoint, options, retries - 1)
        }
        throw new ApiError('Request timeout', 408, error)
      }

      // Handle network errors with retry
      if (retries > 0 && (error as Error).message.includes('fetch')) {
        console.warn(`Network error, retrying... (${retries} retries left)`)
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second before retry
        return this.request<T>(endpoint, options, retries - 1)
      }

      throw new ApiError('Network error', 0, error)
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint
    return this.request<T>(url, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: unknown, customTimeout?: number): Promise<ApiResponse<T>> {
    // Use custom timeout for specific requests (like summary generation)
    const originalTimeout = this.defaultTimeout
    if (customTimeout) {
      this.defaultTimeout = customTimeout
    }
    
    try {
      return await this.request<T>(endpoint, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      })
    } finally {
      // Restore original timeout
      if (customTimeout) {
        this.defaultTimeout = originalTimeout
      }
    }
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()

// ApiError is already exported above with the class declaration
