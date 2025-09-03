/**
 * Authentication Service
 * Handles user authentication and registration
 */

import { apiClient } from '@/lib/api/client'
import type { User } from '@/types/database'
import type { RegisterRequestParams, LoginRequestParams } from '@/types/api'

export type RegisterData = RegisterRequestParams

export type LoginData = LoginRequestParams

export interface LoginResponse {
  token?: string
  user?: Pick<User, 'id' | 'email'> & {
    role: string
  }
}

export class AuthService {
  async register(userData: RegisterData): Promise<{ id: string }> {
    const response = await apiClient.post<{ id: string }>('/api/auth/register', userData)

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Registration failed')
    }

    return response.data
  }

  async login(credentials: LoginData): Promise<LoginResponse> {
    // This would typically use NextAuth.js signIn
    // For now, we'll use the API client for consistency
    const response = await apiClient.post('/api/auth/login', credentials)

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Login failed')
    }

    return response.data
  }
}

// Export singleton instance
export const authService = new AuthService()
