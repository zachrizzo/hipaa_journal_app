import type { User, Session, JournalEntry, EntryVersion, EntryShare, AuditLog, SystemConfig } from '@prisma/client'

export type { User, Session, JournalEntry, EntryVersion, EntryShare, AuditLog, SystemConfig }

export type { UserRole, ShareScope, EntryStatus, AuditAction } from '@prisma/client'

export type UserWithSessions = User & {
  sessions: Session[]
}

export type UserWithEntries = User & {
  entries: JournalEntry[]
}

export type JournalEntryWithUser = JournalEntry & {
  user: User
}

export type JournalEntryWithShares = JournalEntry & {
  shares: EntryShare[]
}

export type JournalEntryWithVersions = JournalEntry & {
  versions: EntryVersion[]
}

export type EntryShareWithRelations = EntryShare & {
  entry: JournalEntry
  provider: User
  client: User
}

export type AuditLogWithUser = AuditLog & {
  user: User | null
}

export type SafeUser = Omit<User, 'hashedPassword' | 'mfaSecret'>

export interface CreateUserInput {
  email: string
  name?: string | null
  role?: import('@prisma/client').UserRole
  password?: string
}

export interface CreateEntryInput {
  title: string
  content: object
  status?: import('@prisma/client').EntryStatus
  mood?: number
  tags?: string[]
}

export interface UpdateEntryInput {
  title?: string
  content?: object
  status?: import('@prisma/client').EntryStatus
  mood?: number
  tags?: string[]
  changeReason?: string
}

export interface CreateShareInput {
  entryId: string
  providerId: string
  scope: import('@prisma/client').ShareScope
  message?: string
  expiresAt?: Date
}

export interface AuditContext {
  userId?: string
  ipAddress?: string
  userAgent?: string
  sessionId?: string
}