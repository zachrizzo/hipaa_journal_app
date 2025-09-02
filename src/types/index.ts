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
  LoginRequestParams,
  LoginResponse,
  RegisterRequestParams,
  PasswordResetRequestParams,
  PasswordUpdateRequestParams,
  CreateEntryRequestParams,
  UpdateEntryRequestParams,
  EntryListResponse,
  EntriesListResponse,
  EntryDetailResponse,
  CreateShareRequestParams,
  UpdateShareRequestParams,
  ShareListResponse,
  UserListResponse,
  ProviderListResponse,
  CreateUserRequestParams,
  AuditLogResponse,
  AuditLogFilters,
  GenerateSummaryRequestParams,
  GenerateSummaryResponse,
  AnalyticsResponse
} from './api'
