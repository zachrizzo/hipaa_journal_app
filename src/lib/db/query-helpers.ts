import type { Prisma } from '@prisma/client'

/**
 * Create a where clause for entries accessible by a user
 * Includes owned entries and shared entries (not revoked, not expired)
 */
export function entryAccessibleByUser(userId: string): Prisma.JournalEntryWhereInput {
  return {
    OR: [
      { userId },
      {
        shares: {
          some: {
            clientId: userId,
            isRevoked: false,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          }
        }
      }
    ]
  }
}

/**
 * Create a where clause for active shares (not revoked, not expired)
 */
export function activeSharesWhere(): Prisma.EntryShareWhereInput {
  return {
    isRevoked: false,
    OR: [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } }
    ]
  }
}

/**
 * Common include pattern for entries with related data
 */
export function entryWithRelations() {
  return {
    user: {
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    },
    shares: {
      where: activeSharesWhere(),
      include: {
        client: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    }
  }
}

/**
 * Pagination helper
 */
export function paginationParams(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit
  return {
    skip,
    take: limit
  }
}

/**
 * Create order by clause for entries
 */
export function entryOrderBy(sortBy: 'createdAt' | 'updatedAt' = 'createdAt', order: 'asc' | 'desc' = 'desc'): Prisma.JournalEntryOrderByWithRelationInput {
  return {
    [sortBy]: order
  }
}

/**
 * Create a search where clause for entries
 */
export function entrySearchWhere(search: string): Prisma.JournalEntryWhereInput {
  return {
    OR: [
      { title: { contains: search, mode: 'insensitive' } },
      { tags: { has: search.toLowerCase() } }
    ]
  }
}