import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAuditContext, createAuditLog } from '@/lib/security/audit'
import type { User } from '@prisma/client'

export interface AuthenticatedRequest extends NextRequest {
  user?: User
}

interface RouteHandlerOptions {
  requireRoles?: Array<'CLIENT' | 'PROVIDER' | 'ADMIN'>
  auditAction?: string
  auditResource?: string
}

type RouteHandler = (
  request: NextRequest,
  context: { params: any; user: User }
) => Promise<NextResponse> | NextResponse

export function withAuth(
  handler: RouteHandler,
  options: RouteHandlerOptions = {}
) {
  return async function (
    request: NextRequest,
    context: { params: any }
  ): Promise<NextResponse> {
    try {
      // Get session
      const session = await getServerSession(authOptions)
      
      // Check authentication
      if (!session?.user?.id) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }

      // Check role authorization if specified
      if (options.requireRoles && options.requireRoles.length > 0) {
        if (!options.requireRoles.includes(session.user.role as any)) {
          return NextResponse.json(
            { success: false, error: 'Forbidden - Insufficient permissions' },
            { status: 403 }
          )
        }
      }

      // Create audit log if action specified
      if (options.auditAction && options.auditResource) {
        const auditContext = getAuditContext(request, session.user.id)
        await createAuditLog(
          {
            action: options.auditAction as any,
            resource: options.auditResource,
            resourceId: context.params?.id || null,
            details: {},
          },
          auditContext
        ).catch((error) => {
          console.error('Failed to create audit log:', error)
          // Don't fail the request if audit logging fails
        })
      }

      // Call the actual handler with user context
      return await handler(request, { ...context, user: session.user as User })
    } catch (error) {
      console.error('Auth wrapper error:', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Convenience wrappers for common patterns
export const withClientAuth = (handler: RouteHandler) =>
  withAuth(handler, { requireRoles: ['CLIENT'] })

export const withProviderAuth = (handler: RouteHandler) =>
  withAuth(handler, { requireRoles: ['PROVIDER'] })

export const withAdminAuth = (handler: RouteHandler) =>
  withAuth(handler, { requireRoles: ['ADMIN'] })