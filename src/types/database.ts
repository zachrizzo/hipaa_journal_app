import type { User, Session, JournalEntry, EntryVersion, EntryShare, AuditLog, SystemConfig, UserRole, ShareScope, EntryStatus, AuditAction } from '.prisma/client'

export type { User, Session, JournalEntry, EntryVersion, EntryShare, AuditLog, SystemConfig }
export type { UserRole, ShareScope, EntryStatus, AuditAction }

// Database relation types
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

// Safe user data without sensitive fields - using type alias as it's a utility type
export type SafeUserData = Omit<User, 'hashedPassword' | 'mfaSecret'>

// Input types for creating/updating records
export interface CreateUserInput extends Pick<User, 'email'> {
  firstName?: User['firstName']
  lastName?: User['lastName']
  role?: UserRole
  password?: string
}

export interface CreateEntryInput extends Pick<JournalEntry, 'title' | 'content'> {
  status?: EntryStatus
  mood?: JournalEntry['mood']
  tags?: JournalEntry['tags']
}

export interface UpdateEntryInput {
  title?: JournalEntry['title']
  content?: JournalEntry['content']
  status?: EntryStatus
  mood?: JournalEntry['mood']
  tags?: JournalEntry['tags']
  changeReason?: EntryVersion['changeReason']
}

export interface CreateShareInput extends Pick<EntryShare, 'entryId' | 'providerId' | 'scope'> {
  message?: EntryShare['message']
  expiresAt?: EntryShare['expiresAt']
}

export interface AuditContext {
  userId?: string
  ipAddress?: string
  userAgent?: string
  sessionId?: string
}