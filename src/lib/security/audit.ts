import type { AuditAction, AuditContext } from '@/types/database'
import { db } from '@/lib/db'

export interface AuditLogData {
  action: AuditAction
  resource: string
  resourceId?: string
  details?: Record<string, unknown>
  entryId?: string
  shareId?: string
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

export function getAuditContext(request: Request | any, userId?: string, sessionId?: string): AuditContext {
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
        ipAddress = request.headers['x-forwarded-for'] || 
                   request.headers['x-real-ip'] || 
                   'unknown'
        userAgent = request.headers['user-agent'] || 'unknown'
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