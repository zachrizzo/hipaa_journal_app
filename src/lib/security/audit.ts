import type { AuditAction, AuditContext, AuditLog } from '@/types/database'
import { db } from '@/lib/db'

// Use generated type but omit auto-generated fields and make optional fields truly optional
export interface AuditLogData extends Omit<AuditLog, 'id' | 'createdAt' | 'userId' | 'ipAddress' | 'userAgent' | 'sessionId' | 'details' | 'entryId' | 'shareId' | 'resourceId'> {
  entryId?: string | null
  shareId?: string | null
  resourceId?: string | null
  details?: Record<string, unknown>
}

export async function createAuditLog(
  data: AuditLogData,
  context: AuditContext
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        userId: context.userId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        details: data.details ? JSON.parse(JSON.stringify(data.details)) : null,
        sessionId: context.sessionId,
        entryId: data.entryId,
        shareId: data.shareId
      }
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}

export async function auditEntryAccess(
  entryId: string,
  action: AuditAction,
  context: AuditContext,
  details?: Record<string, unknown>
): Promise<void> {
  await createAuditLog(
    {
      action,
      resource: 'journal_entries',
      resourceId: entryId,
      entryId,
      details
    },
    context
  )
}

export async function auditShareAction(
  shareId: string,
  action: AuditAction,
  context: AuditContext,
  details?: Record<string, unknown>
): Promise<void> {
  await createAuditLog(
    {
      action,
      resource: 'entry_shares',
      resourceId: shareId,
      shareId,
      details
    },
    context
  )
}

export async function auditUserAction(
  userId: string,
  action: AuditAction,
  context: AuditContext,
  details?: Record<string, unknown>
): Promise<void> {
  await createAuditLog(
    {
      action,
      resource: 'users',
      resourceId: userId,
      details
    },
    context
  )
}

export async function auditSystemAction(
  action: AuditAction,
  resource: string,
  context: AuditContext,
  details?: Record<string, unknown>
): Promise<void> {
  await createAuditLog(
    {
      action,
      resource,
      details
    },
    context
  )
}

export function getAuditContext(request: Request | null | undefined, userId?: string, sessionId?: string): AuditContext {
  let ipAddress = 'unknown'
  let userAgent = 'unknown'
  
  try {
    if (request && request.headers) {
      if (typeof request.headers.get === 'function') {
        // Standard Request object
        ipAddress = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
        userAgent = request.headers.get('user-agent') || 'unknown'
      } else if (typeof request.headers === 'object') {
        // NextAuth request object
        const headers = request.headers as unknown as Record<string, string | string[]>
        ipAddress = Array.isArray(headers['x-forwarded-for'])
          ? headers['x-forwarded-for'][0]
          : headers['x-forwarded-for'] as string || 'unknown'
        userAgent = headers['user-agent'] as string || 'unknown'
      }
    }
  } catch (error) {
    console.warn('Error extracting audit context:', error)
  }

  return {
    userId,
    ipAddress,
    userAgent,
    sessionId
  }
}