import type { UserRole, ShareScope, EntryStatus, AuditAction } from './database'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  sort?: 'asc' | 'desc'
  sortBy?: string
}

export interface PaginationResponse<T> {
  items: T[]
  totalItems: number
  totalPages: number
  currentPage: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// Auth API types
export interface SessionUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: UserRole
}

export interface LoginRequest {
  email: string
  password: string
  mfaCode?: string
}

export interface LoginResponse {
  user: SessionUser
  sessionToken: string
  expiresAt: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName?: string
  lastName?: string
  role?: UserRole
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordUpdateRequest {
  currentPassword: string
  newPassword: string
}

// Entry API types
export interface CreateEntryRequest {
  title: string
  content: object
  status?: EntryStatus
  mood?: number
  tags?: string[]
}

export interface UpdateEntryRequest {
  title?: string
  content?: object
  status?: EntryStatus
  mood?: number
  tags?: string[]
  changeReason?: string
}

export interface EntryListResponse {
  id: string
  title: string
  status: EntryStatus
  mood: number | null
  tags: string[]
  wordCount: number
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  aiSummary: string | null
  aiSummaryAt: string | null
}

export interface EntryDetailResponse {
  id: string
  title: string
  content: object
  contentHtml: string | null
  status: EntryStatus
  mood: number | null
  tags: string[]
  aiSummary: string | null
  aiSummaryAt: string | null
  wordCount: number
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  versions: {
    id: string
    versionNumber: number
    title: string
    changeReason: string | null
    createdAt: string
  }[]
  shares: {
    id: string
    clientId: string
    clientName: string | null
    scope: ShareScope
    createdAt: string
  }[]
}

export interface EntriesListResponse {
  entries: EntryListResponse[]
  total: number
  page: number
  totalPages: number
}

// Share API types
export interface CreateShareRequest {
  entryId: string
  providerId: string
  scope: ShareScope
  message?: string
  expiresAt?: string
}

export interface UpdateShareRequest {
  scope?: ShareScope
  expiresAt?: string
}

export interface ShareListResponse {
  id: string
  entryId: string
  entryTitle: string
  providerName: string | null
  clientName: string | null
  scope: ShareScope
  message: string | null
  expiresAt: string | null
  createdAt: string
}

// User API types
export interface UserListResponse {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: UserRole
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

export interface ProviderListResponse {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  role: string
}

export interface CreateUserRequest {
  email: string
  firstName?: string
  lastName?: string
  role: UserRole
  sendInvite?: boolean
}

// Audit API types
export interface AuditLogResponse {
  id: string
  action: AuditAction
  resource: string
  resourceId: string | null
  userEmail: string | null
  ipAddress: string | null
  details: object | null
  createdAt: string
}

export interface AuditLogFilters {
  action?: AuditAction
  resource?: string
  userId?: string
  startDate?: string
  endDate?: string
}

// AI API types
export interface GenerateSummaryRequest {
  entryId: string
  forceRegenerate?: boolean
}

export interface GenerateSummaryResponse {
  summary: string
  wordCount: number
  generatedAt: string
}

// Analytics types
export interface AnalyticsResponse {
  totalEntries: number
  totalWords: number
  averageMood: number | null
  entriesThisMonth: number
  wordsThisMonth: number
  mostUsedTags: Array<{
    tag: string
    count: number
  }>
  moodTrend: Array<{
    date: string
    mood: number | null
  }>
}