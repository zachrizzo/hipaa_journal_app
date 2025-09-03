import type { UserRole, ShareScope, EntryStatus, SafeUserData, JournalEntry, EntryVersion, EntryShare, User, AuditLog } from './database'

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
export interface LoginRequestParams {
  email: string
  password: string
  mfaCode?: string
}

export interface LoginResponse {
  user: SafeUserData
  sessionToken: string
  expiresAt: string
}

export interface RegisterRequestParams {
  email: string
  password: string
  firstName?: string
  lastName?: string
  role?: UserRole
}

export interface PasswordResetRequestParams {
  email: string
}

export interface PasswordUpdateRequestParams {
  currentPassword: string
  newPassword: string
}

// Entry API types
export interface CreateEntryRequestParams {
  title: string
  content: object
  status?: EntryStatus
  mood?: number
  tags?: string[]
}

export interface UpdateEntryRequestParams {
  title?: string
  content?: object
  status?: EntryStatus
  mood?: number
  tags?: string[]
  changeReason?: string
}

export interface EntryListResponse extends Pick<JournalEntry, 
  'id' | 'title' | 'status' | 'mood' | 'tags' | 'wordCount' | 'aiSummary'> {
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  aiSummaryAt: string | null
}

export interface EntryDetailResponse extends Pick<JournalEntry,
  'id' | 'title' | 'content' | 'contentHtml' | 'status' | 'mood' | 'tags' | 'aiSummary' | 'wordCount'> {
  aiSummaryAt: string | null
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  versions: Array<Pick<EntryVersion, 'id' | 'versionNumber' | 'title' | 'changeReason'> & {
    createdAt: string
  }>
  shares: Array<Pick<EntryShare, 'id' | 'clientId' | 'scope'> & {
    clientName: string | null
    createdAt: string
  }>
}

export interface EntriesListResponse {
  items: EntryListResponse[]
  total: number
  page: number
  totalPages: number
  hasMore: boolean
}

// Share API types
export interface CreateShareRequestParams {
  entryId: string
  providerId: string
  scope: ShareScope
  message?: string
  expiresAt?: string
}

export interface UpdateShareRequestParams {
  scope?: ShareScope
  expiresAt?: string
}

export interface ShareListResponse extends Pick<EntryShare, 'id' | 'entryId' | 'scope' | 'message'> {
  entryTitle: string
  providerName: string | null
  clientName: string | null
  expiresAt: string | null
  createdAt: string
}

// User API types
export interface UserListResponse extends Pick<User,
  'id' | 'email' | 'firstName' | 'lastName' | 'role' | 'isActive'> {
  lastLoginAt: string | null
  createdAt: string
}

export interface ProviderListResponse extends Pick<User,
  'id' | 'firstName' | 'lastName' | 'email'> {
  role: string
}

export interface CreateUserRequestParams extends Pick<User, 'email' | 'role'> {
  firstName?: User['firstName']
  lastName?: User['lastName']
  sendInvite?: boolean
}

// Audit API types
export interface AuditLogResponse extends Pick<AuditLog,
  'id' | 'action' | 'resource' | 'resourceId' | 'ipAddress' | 'details'> {
  userEmail: string | null
  createdAt: string
}

export interface AuditLogFilters {
  action?: AuditLog['action']
  resource?: AuditLog['resource']
  userId?: AuditLog['userId']
  startDate?: string
  endDate?: string
}

// AI API types
export interface GenerateSummaryRequestParams {
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