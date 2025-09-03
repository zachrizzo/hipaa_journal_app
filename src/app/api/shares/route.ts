import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { createShare, getSharesForProvider, getSharesForClient } from '@/lib/db/shares'
import { getAuditContext } from '@/lib/security/audit'
import type { ApiResponse } from '@/types/api'
import type { EntryShare } from '@/types/database'

interface ShareResponseItem extends Pick<EntryShare, 
  'id' | 'entryId' | 'providerId' | 'clientId' | 'scope' | 'message' | 'isRevoked' | 'revokedReason'> {
  entryTitle: string
  providerName?: string | null
  clientName?: string | null
  expiresAt: string | null
  revokedAt: string | null
  createdAt: string
  updatedAt: string
}

const createShareSchema = z.object({
  entryId: z.string().cuid('Invalid entry ID'),
  providerId: z.string().cuid('Invalid provider ID'),
  scope: z.enum(['NONE', 'TITLE_ONLY', 'SUMMARY_ONLY', 'FULL_ACCESS']),
  message: z.string().max(500, 'Message too long').optional(),
  expiresAt: z.string().datetime().optional()
})

const listSharesSchema = z.object({
  type: z.enum(['provided', 'received']).default('provided'),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  entryId: z.string().cuid().optional(),
  clientId: z.string().cuid().optional(),
  providerId: z.string().cuid().optional(),
  includeRevoked: z.boolean().default(false),
  includeExpired: z.boolean().default(false)
})

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Pick<EntryShare, 'id'>>>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only clients and providers can create shares
    if (!['CLIENT', 'PROVIDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createShareSchema.parse(body)

    const context = getAuditContext(request, session.user.id)
    const expiresAt = validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined

    const share = await createShare(
      {
        entryId: validatedData.entryId,
        providerId: validatedData.providerId,
        scope: validatedData.scope,
        message: validatedData.message,
        expiresAt
      },
      session.user.id,
      context
    )

    return NextResponse.json(
      { 
        success: true, 
        data: { id: share.id },
        message: 'Entry shared successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || 'Validation error' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create share'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<ShareResponseItem[]>>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    // Convert string params to appropriate types
    const params = {
      ...queryParams,
      limit: queryParams.limit ? parseInt(queryParams.limit) : undefined,
      offset: queryParams.offset ? parseInt(queryParams.offset) : undefined,
      includeRevoked: queryParams.includeRevoked === 'true',
      includeExpired: queryParams.includeExpired === 'true'
    }

    const validatedParams = listSharesSchema.parse(params)
    const context = getAuditContext(request, session.user.id)

    let shares

    if (validatedParams.type === 'provided') {
      // User is viewing shares they've created (as a provider)
      if (session.user.role !== 'PROVIDER') {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      shares = await getSharesForProvider(session.user.id, context, {
        entryId: validatedParams.entryId,
        clientId: validatedParams.clientId,
        includeRevoked: validatedParams.includeRevoked,
        limit: validatedParams.limit,
        offset: validatedParams.offset
      })
    } else {
      // User is viewing shares they've received (as a client)
      shares = await getSharesForClient(session.user.id, context, {
        providerId: validatedParams.providerId,
        includeExpired: validatedParams.includeExpired,
        limit: validatedParams.limit,
        offset: validatedParams.offset
      })
    }

    // Transform data for API response
    const transformedShares = shares.map(share => ({
      id: share.id,
      entryId: share.entryId,
      entryTitle: share.entry.title,
      providerId: share.providerId,
      providerName: validatedParams.type === 'received' ? 
        (share.provider.firstName && share.provider.lastName ? 
          `${share.provider.firstName} ${share.provider.lastName}` : 
          share.provider.firstName || share.provider.lastName || 'Unknown') : undefined,
      clientId: share.clientId,
      clientName: validatedParams.type === 'provided' ? 
        (share.client.firstName && share.client.lastName ? 
          `${share.client.firstName} ${share.client.lastName}` : 
          share.client.firstName || share.client.lastName || 'Unknown') : undefined,
      scope: share.scope,
      message: share.message,
      expiresAt: share.expiresAt?.toISOString() || null,
      isRevoked: share.isRevoked,
      revokedAt: share.revokedAt?.toISOString() || null,
      revokedReason: share.revokedReason,
      createdAt: share.createdAt.toISOString(),
      updatedAt: share.updatedAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: transformedShares
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch shares' },
      { status: 500 }
    )
  }
}