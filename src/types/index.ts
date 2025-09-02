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
  UserWithSessions,
  UserWithEntries,
  JournalEntryWithUser,
  JournalEntryWithShares,
  JournalEntryWithVersions,
  EntryShareWithRelations,
  AuditLogWithUser,
  SafeUser,

  // Input interfaces
  CreateUserInput,
  CreateEntryInput,
  UpdateEntryInput,
  CreateShareInput,
  AuditContext,

  // Utility types
  Tables
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
