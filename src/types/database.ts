import type { User, Session, JournalEntry, EntryVersion, EntryShare, AuditLog, SystemConfig, UserRole, ShareScope, EntryStatus, AuditAction } from '.prisma/client'

export type { User, Session, JournalEntry, EntryVersion, EntryShare, AuditLog, SystemConfig }
export type { UserRole, ShareScope, EntryStatus, AuditAction }

// All types are already exported above or defined below

// Database table map for legacy compatibility - use direct imports instead
export const tableMap = {
  users: {} as User,
  sessions: {} as Session,
  journal_entries: {} as JournalEntry,
  entry_versions: {} as EntryVersion,
  entry_shares: {} as EntryShare,
  audit_logs: {} as AuditLog,
  system_config: {} as SystemConfig
}

export interface UserWithSessionsData extends User {
  sessions: Session[]
}

export interface UserWithEntriesData extends User {
  entries: JournalEntry[]
}

export interface JournalEntryWithUserData extends JournalEntry {
  user: User
}

export interface JournalEntryWithSharesData extends JournalEntry {
  shares: EntryShare[]
}

export interface JournalEntryWithVersionsData extends JournalEntry {
  versions: EntryVersion[]
}

export interface EntryShareWithRelationsData extends EntryShare {
  entry: JournalEntry
  provider: User
  client: User
}

export interface AuditLogWithUserData extends AuditLog {
  user: User | null
}

export type SafeUserData = Omit<User, 'hashedPassword' | 'mfaSecret'>

// Legacy compatibility - prefer direct imports
export type Tables<T extends 'users'> = T extends 'users' ? User : 
  T extends 'sessions' ? Session :
  T extends 'journal_entries' ? JournalEntry :
  T extends 'entry_versions' ? EntryVersion :
  T extends 'entry_shares' ? EntryShare :
  T extends 'audit_logs' ? AuditLog :
  T extends 'system_config' ? SystemConfig : never

export interface CreateUserInput {
  email: string
  firstName?: string | null
  lastName?: string | null
  role?: UserRole
  password?: string
}

export interface CreateEntryInput {
  title: string
  content: object
  status?: EntryStatus
  mood?: number
  tags?: string[]
}

export interface UpdateEntryInput {
  title?: string
  content?: object
  status?: EntryStatus
  mood?: number
  tags?: string[]
  changeReason?: string
}

export interface CreateShareInput {
  entryId: string
  providerId: string
  scope: ShareScope
  message?: string
  expiresAt?: Date
}

export interface AuditContext {
  userId?: string
  ipAddress?: string
  userAgent?: string
  sessionId?: string
}