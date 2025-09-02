// Centralized type exports for the entire application
// This ensures all database types come from the generated Prisma types

// Database types (generated from Prisma)
export type {
  // Core database models
  User,
  Session,
  JournalEntry,
  EntryVersion,
  EntryShare,
  AuditLog,
  SystemConfig,

  // Enums
  UserRole,
  ShareScope,
  EntryStatus,
  AuditAction,

  // Composite types
  UserWithSessionsData,
  UserWithEntriesData,
  JournalEntryWithUserData,
  JournalEntryWithSharesData,
  JournalEntryWithVersionsData,
  EntryShareWithRelationsData,
  AuditLogWithUserData,
  SafeUserData,

  // Input interfaces
  CreateUserInput,
  CreateEntryInput,
  UpdateEntryInput,
  CreateShareInput,
  AuditContext
} from './database'

// API types
export type {
  ApiResponse,
  PaginationParams,
  PaginationResponse,
  SessionUser,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  PasswordResetRequest,
  PasswordUpdateRequest,
  CreateEntryRequest,
  UpdateEntryRequest,
  EntryListResponse,
  EntriesListResponse,
  EntryDetailResponse,
  CreateShareRequest,
  UpdateShareRequest,
  ShareListResponse,
  UserListResponse,
  ProviderListResponse,
  CreateUserRequest,
  AuditLogResponse,
  AuditLogFilters,
  GenerateSummaryRequest,
  GenerateSummaryResponse,
  AnalyticsResponse
} from './api'
