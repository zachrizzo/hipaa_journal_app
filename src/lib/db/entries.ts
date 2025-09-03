import { db } from '@/lib/db'
import { validateTipTapContent } from '@/lib/security/sanitize'
import { auditEntryAccess } from '@/lib/security/audit'
import { toPlainText } from '@/lib/utils/tiptap-parser'
import type { Prisma } from '@prisma/client'
import type { 
  JournalEntry, 
  EntryStatus,
  CreateEntryInput, 
  UpdateEntryInput,
  AuditContext,
  JournalEntryWithUserData,
  JournalEntryWithSharesData,
  JournalEntryWithVersionsData
} from '@/types/database'

export async function createEntry(
  data: CreateEntryInput,
  userId: string,
  context: AuditContext
): Promise<JournalEntry> {
  if (!validateTipTapContent(data.content)) {
    throw new Error('Invalid content format')
  }

  // Extract plain text from TipTap JSON for word count
  const plainText = toPlainText(data.content)
  const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length
  
  // Generate sanitized HTML for display (we'll need to implement TipTap to HTML conversion)
  // For now, store the JSON and we'll render it client-side
  const contentHtml = JSON.stringify(data.content)

  const entry = await db.journalEntry.create({
    data: {
      title: data.title,
      content: data.content as Prisma.JsonObject,
      contentHtml,
      status: data.status || 'DRAFT',
      mood: data.mood,
      tags: (data.tags || []).map(tag => tag.toLowerCase()),
      wordCount,
      userId,
      publishedAt: data.status === 'PUBLISHED' ? new Date() : null
    }
  })

  // Audit the creation
  await auditEntryAccess(entry.id, 'CREATE', context)

  return entry
}

export async function getEntryById(
  id: string,
  userId: string,
  context: AuditContext
): Promise<JournalEntry | null> {
  const entry = await db.journalEntry.findFirst({
    where: {
      id,
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
  })

  if (entry) {
    // Audit the access
    await auditEntryAccess(entry.id, 'READ', context)
  }

  return entry
}

export async function getEntriesForUser(
  userId: string,
  options: {
    status?: EntryStatus
    limit?: number
    offset?: number
    search?: string
    tags?: string[]
    sortBy?: 'createdAt' | 'updatedAt' | 'publishedAt'
    sortOrder?: 'asc' | 'desc'
  } = {}
): Promise<{ entries: JournalEntry[]; total: number }> {
  const {
    status,
    limit = 20,
    offset = 0,
    search,
    tags,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options

  const where: Prisma.JournalEntryWhereInput = {
    userId,
    ...(status && { status }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { contentHtml: { contains: search, mode: 'insensitive' } }
      ]
    }),
    ...(tags && tags.length > 0 && {
      tags: {
        hasSome: tags.map(tag => tag.toLowerCase())
      }
    })
  }

  const [entries, total] = await Promise.all([
    db.journalEntry.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { [sortBy]: sortOrder }
    }),
    db.journalEntry.count({ where })
  ])

  return { entries, total }
}

export async function updateEntry(
  id: string,
  data: UpdateEntryInput,
  userId: string,
  context: AuditContext
): Promise<JournalEntry> {
  // Verify ownership
  const existingEntry = await db.journalEntry.findFirst({
    where: { id, userId }
  })

  if (!existingEntry) {
    throw new Error('Entry not found or access denied')
  }

  if (data.content && !validateTipTapContent(data.content)) {
    throw new Error('Invalid content format')
  }

  // Create version history
  await db.entryVersion.create({
    data: {
      entryId: id,
      versionNumber: await getNextVersionNumber(id),
      title: existingEntry.title,
      content: existingEntry.content as Prisma.JsonObject,
      contentHtml: existingEntry.contentHtml ?? null,
      changeReason: data.changeReason,
      createdById: userId
    }
  })

  const updateData: Prisma.JournalEntryUpdateInput = {
    ...(data.title && { title: data.title }),
    ...(data.status && { 
      status: data.status,
      publishedAt: data.status === 'PUBLISHED' && existingEntry.status !== 'PUBLISHED' 
        ? new Date() 
        : existingEntry.publishedAt
    }),
    ...(data.mood !== undefined && { mood: data.mood }),
    ...(data.tags && { tags: data.tags.map(tag => tag.toLowerCase()) })
  }

  if (data.content) {
    updateData.content = data.content
    
    // Extract plain text from TipTap JSON for word count
    const plainText = toPlainText(data.content)
    updateData.wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length
    
    // Store JSON for now, render to HTML client-side
    updateData.contentHtml = JSON.stringify(data.content)
  }

  const entry = await db.journalEntry.update({
    where: { id },
    data: updateData
  })

  // Audit the update
  await auditEntryAccess(entry.id, 'UPDATE', context, {
    changes: Object.keys(updateData),
    changeReason: data.changeReason
  })

  return entry
}

export async function deleteEntry(
  id: string,
  userId: string,
  context: AuditContext
): Promise<void> {
  // Verify ownership
  const existingEntry = await db.journalEntry.findFirst({
    where: { id, userId }
  })

  if (!existingEntry) {
    throw new Error('Entry not found or access denied')
  }

  await db.$transaction(async (tx) => {
    // Delete related data
    await tx.entryVersion.deleteMany({ where: { entryId: id } })
    await tx.entryShare.deleteMany({ where: { entryId: id } })
    await tx.auditLog.deleteMany({ where: { entryId: id } })
    
    // Delete the entry
    await tx.journalEntry.delete({ where: { id } })
  })

  // Audit the deletion
  await auditEntryAccess(id, 'DELETE', context)
}

export async function getEntryWithDetails(
  id: string,
  userId: string,
  context: AuditContext
): Promise<(JournalEntryWithSharesData & JournalEntryWithVersionsData) | null> {
  const entry = await db.journalEntry.findFirst({
    where: {
      id,
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
    },
    include: {
      shares: {
        include: {
          client: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        },
        where: { isRevoked: false }
      },
      versions: {
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  }) as (JournalEntryWithSharesData & JournalEntryWithVersionsData) | null

  if (entry) {
    // Audit the access
    await auditEntryAccess(entry.id, 'READ', context)
  }

  return entry
}

export async function getSharedEntries(
  userId: string
): Promise<JournalEntryWithUserData[]> {
  const entries = await db.journalEntry.findMany({
    where: {
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
    },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, role: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })

  return entries as JournalEntryWithUserData[]
}

async function getNextVersionNumber(entryId: string): Promise<number> {
  const lastVersion = await db.entryVersion.findFirst({
    where: { entryId },
    orderBy: { versionNumber: 'desc' }
  })

  return (lastVersion?.versionNumber || 0) + 1
}

