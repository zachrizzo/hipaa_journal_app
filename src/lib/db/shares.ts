import { db } from '@/lib/db'
import { auditShareAction, createAuditLog } from '@/lib/security/audit'
import type { Prisma } from '@prisma/client'
import type { 
  EntryShare, 
  ShareScope,
  CreateShareInput,
  AuditContext,
  EntryShareWithRelationsData
} from '@/types/database'

export async function createShare(
  data: CreateShareInput,
  clientId: string,
  context: AuditContext
): Promise<EntryShare> {
  // Verify the client owns the entry
  const entry = await db.journalEntry.findFirst({
    where: {
      id: data.entryId,
      userId: clientId
    }
  })

  if (!entry) {
    throw new Error('Entry not found or access denied')
  }

  // Verify the provider exists and is a provider or has appropriate role
  const provider = await db.user.findUnique({
    where: { id: data.providerId }
  })

  if (!provider || !provider.isActive || provider.role !== 'PROVIDER') {
    throw new Error('Provider not found, inactive, or invalid role')
  }

  // Check if share already exists
  const existingShare = await db.entryShare.findUnique({
    where: {
      entryId_providerId_clientId: {
        entryId: data.entryId,
        providerId: data.providerId,
        clientId
      }
    }
  })

  if (existingShare && !existingShare.isRevoked) {
    throw new Error('Entry is already shared with this provider')
  }

  // Create or update the share
  const share = existingShare
    ? await db.entryShare.update({
        where: { id: existingShare.id },
        data: {
          scope: data.scope,
          message: data.message,
          expiresAt: data.expiresAt,
          isRevoked: false,
          revokedAt: null,
          revokedReason: null
        }
      })
    : await db.entryShare.create({
        data: {
          entryId: data.entryId,
          providerId: data.providerId,
          clientId,
          scope: data.scope,
          message: data.message,
          expiresAt: data.expiresAt
        }
      })

  // Audit the share creation
  await auditShareAction(share.id, 'SHARE', context, {
    entryId: data.entryId,
    providerId: data.providerId,
    scope: data.scope,
    message: data.message,
    expiresAt: data.expiresAt?.toISOString()
  })

  return share
}

export async function getSharesForProvider(
  providerId: string,
  context: AuditContext,
  options: {
    entryId?: string
    clientId?: string
    includeRevoked?: boolean
    limit?: number
    offset?: number
  } = {}
): Promise<EntryShareWithRelationsData[]> {
  const {
    entryId,
    clientId,
    includeRevoked = false,
    limit = 50,
    offset = 0
  } = options

  const shares = await db.entryShare.findMany({
    where: {
      providerId,
      ...(entryId && { entryId }),
      ...(clientId && { clientId }),
      ...(includeRevoked ? {} : { isRevoked: false })
    },
    include: {
      entry: {
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          wordCount: true
        }
      },
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit
  })

  // Audit the access
  await createAuditLog(
    {
      action: 'READ',
      resource: 'entry_shares',
      details: { count: shares.length, providerId }
    },
    context
  )
  
  return shares as EntryShareWithRelationsData[]
}

export async function getSharesForClient(
  clientId: string,
  context: AuditContext,
  options: {
    providerId?: string
    includeExpired?: boolean
    limit?: number
    offset?: number
  } = {}
): Promise<EntryShareWithRelationsData[]> {
  const {
    providerId,
    includeExpired = false,
    limit = 50,
    offset = 0
  } = options

  const where: Prisma.EntryShareWhereInput = {
    clientId,
    isRevoked: false,
    ...(providerId && { providerId })
  }

  if (!includeExpired) {
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } }
    ]
  }

  const shares = await db.entryShare.findMany({
    where,
    include: {
      entry: {
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          wordCount: true,
          aiSummary: true,
          mood: true,
          tags: true
        }
      },
      provider: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit
  })

  // Audit the access
  await createAuditLog(
    {
      action: 'READ',
      resource: 'entry_shares',
      details: { count: shares.length, clientId }
    },
    context
  )
  
  return shares as EntryShareWithRelationsData[]
}

export async function updateShare(
  shareId: string,
  providerId: string,
  updates: {
    scope?: ShareScope
    message?: string
    expiresAt?: Date | null
  },
  context: AuditContext
): Promise<EntryShare> {
  // Verify the share exists and belongs to the provider
  const existingShare = await db.entryShare.findFirst({
    where: {
      id: shareId,
      providerId,
      isRevoked: false
    }
  })

  if (!existingShare) {
    throw new Error('Share not found or access denied')
  }

  const updatedShare = await db.entryShare.update({
    where: { id: shareId },
    data: {
      ...(updates.scope && { scope: updates.scope }),
      ...(updates.message !== undefined && { message: updates.message }),
      ...(updates.expiresAt !== undefined && { expiresAt: updates.expiresAt })
    }
  })

  // Audit the share update
  await auditShareAction(shareId, 'UPDATE', context, {
    updates,
    previousScope: existingShare.scope,
    previousExpiresAt: existingShare.expiresAt?.toISOString()
  })

  return updatedShare
}

export async function revokeShare(
  shareId: string,
  providerId: string,
  reason: string,
  context: AuditContext
): Promise<void> {
  // Verify the share exists and belongs to the provider
  const existingShare = await db.entryShare.findFirst({
    where: {
      id: shareId,
      providerId,
      isRevoked: false
    }
  })

  if (!existingShare) {
    throw new Error('Share not found or access denied')
  }

  await db.entryShare.update({
    where: { id: shareId },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: reason
    }
  })

  // Audit the share revocation
  await auditShareAction(shareId, 'UNSHARE', context, {
    reason,
    entryId: existingShare.entryId,
    clientId: existingShare.clientId
  })
}

export async function getShareById(
  shareId: string,
  userId: string,
  context: AuditContext
): Promise<EntryShareWithRelationsData | null> {
  const share = await db.entryShare.findFirst({
    where: {
      id: shareId,
      OR: [
        { providerId: userId },
        { clientId: userId }
      ],
      isRevoked: false
    },
    include: {
      entry: {
        select: {
          id: true,
          title: true,
          content: true,
          contentHtml: true,
          status: true,
          mood: true,
          tags: true,
          aiSummary: true,
          aiSummaryAt: true,
          createdAt: true,
          updatedAt: true,
          wordCount: true
        }
      },
      provider: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true
        }
      },
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true
        }
      }
    }
  })

  if (!share) {
    return null
  }

  // Check if share has expired
  if (share.expiresAt && share.expiresAt < new Date()) {
    return null
  }

  // Audit the share access
  await auditShareAction(shareId, 'READ', context, {
    entryId: share.entryId,
    accessType: userId === share.providerId ? 'provider' : 'client',
    scope: share.scope
  })

  return share as EntryShareWithRelationsData
}

export async function getAvailableProviders(
  clientId: string
): Promise<Array<{ id: string; firstName: string | null; lastName: string | null; email: string; role: string }>> {
  // Get users who can receive shares from clients (providers and admins)
  const users = await db.user.findMany({
    where: {
      id: { not: clientId },
      isActive: true,
      role: 'PROVIDER'
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true
    },
    orderBy: [
      { role: 'asc' },
      { firstName: 'asc' },
      { email: 'asc' }
    ]
  })

  return users
}

export async function getAvailableClients(
  providerId: string
): Promise<Array<{ id: string; firstName: string | null; lastName: string | null; email: string; role: string }>> {
  // Get users who can receive shares (clients and other providers)
  const users = await db.user.findMany({
    where: {
      id: { not: providerId },
      isActive: true,
      role: { in: ['CLIENT', 'PROVIDER'] }
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true
    },
    orderBy: [
      { role: 'asc' },
      { firstName: 'asc' },
      { email: 'asc' }
    ]
  })

  return users
}

export async function getShareStatistics(
  providerId: string
): Promise<{
  totalShares: number
  activeShares: number
  expiredShares: number
  revokedShares: number
  sharesByScope: Record<ShareScope, number>
  recentActivity: Array<{
    action: string
    entryTitle: string
    clientName: string | null
    createdAt: Date
  }>
}> {
  const [
    totalShares,
    activeShares,
    expiredShares,
    revokedShares,
    scopeStats,
    recentActivity
  ] = await Promise.all([
    db.entryShare.count({ where: { providerId } }),
    db.entryShare.count({
      where: {
        providerId,
        isRevoked: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    }),
    db.entryShare.count({
      where: {
        providerId,
        isRevoked: false,
        expiresAt: { lte: new Date() }
      }
    }),
    db.entryShare.count({
      where: {
        providerId,
        isRevoked: true
      }
    }),
    db.entryShare.groupBy({
      by: ['scope'],
      where: { providerId },
      _count: true
    }),
    db.entryShare.findMany({
      where: { providerId },
      include: {
        entry: { select: { title: true } },
        client: { select: { firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
  ])

  const sharesByScope: Record<ShareScope, number> = {
    NONE: 0,
    TITLE_ONLY: 0,
    SUMMARY_ONLY: 0,
    FULL_ACCESS: 0
  }

  scopeStats.forEach(stat => {
    sharesByScope[stat.scope] = stat._count
  })

  return {
    totalShares,
    activeShares,
    expiredShares,
    revokedShares,
    sharesByScope,
    recentActivity: recentActivity.map(share => ({
      action: share.isRevoked ? 'revoked' : 'shared',
      entryTitle: share.entry.title,
      clientName: share.client.firstName && share.client.lastName ? `${share.client.firstName} ${share.client.lastName}` : share.client.firstName || share.client.lastName || 'Unknown',
      createdAt: share.createdAt
    }))
  }
}