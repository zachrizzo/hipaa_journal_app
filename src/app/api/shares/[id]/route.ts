import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { getShareById, updateShare, revokeShare } from '@/lib/db/shares'
import { getAuditContext } from '@/lib/security/audit'
import type { ApiResponse, UpdateShareRequest } from '@/types/api'

const updateShareSchema = z.object({
  scope: z.enum(['NONE', 'TITLE_ONLY', 'SUMMARY_ONLY', 'FULL_ACCESS']).optional(),
  message: z.string().max(500, 'Message too long').optional(),
  expiresAt: z.string().datetime().optional().nullable()
})

const revokeShareSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(200, 'Reason too long')
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Record<string, unknown>>>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: shareId } = await params
    const context = getAuditContext(request, session.user.id)

    const share = await getShareById(shareId, session.user.id, context)

    if (!share) {
      return NextResponse.json(
        { success: false, error: 'Share not found or access denied' },
        { status: 404 }
      )
    }

    // Filter entry content based on share scope and user role
    let entryData: Record<string, unknown> = {
      id: share.entry.id,
      status: share.entry.status,
      createdAt: share.entry.createdAt.toISOString(),
      updatedAt: share.entry.updatedAt.toISOString(),
      wordCount: share.entry.wordCount
    }

    const isProvider = session.user.id === share.providerId
    const isClient = session.user.id === share.clientId

    if (isProvider) {
      // Provider can see full entry data
      entryData = {
        ...entryData,
        title: share.entry.title,
        content: share.entry.content,
        contentHtml: share.entry.contentHtml,
        mood: share.entry.mood,
        tags: share.entry.tags,
        aiSummary: share.entry.aiSummary,
        aiSummaryAt: share.entry.aiSummaryAt?.toISOString() || null
      }
    } else if (isClient) {
      // Client sees data based on share scope
      switch (share.scope) {
        case 'FULL_ACCESS':
          entryData = {
            ...entryData,
            title: share.entry.title,
            content: share.entry.content,
            contentHtml: share.entry.contentHtml,
            mood: share.entry.mood,
            tags: share.entry.tags,
            aiSummary: share.entry.aiSummary,
            aiSummaryAt: share.entry.aiSummaryAt?.toISOString() || null
          }
          break
        case 'SUMMARY_ONLY':
          entryData = {
            ...entryData,
            title: share.entry.title,
            aiSummary: share.entry.aiSummary,
            aiSummaryAt: share.entry.aiSummaryAt?.toISOString() || null,
            mood: share.entry.mood,
            tags: share.entry.tags
          }
          break
        case 'TITLE_ONLY':
          entryData = {
            ...entryData,
            title: share.entry.title
          }
          break
        case 'NONE':
        default:
          // Only basic metadata
          break
      }
    }

    const responseData = {
      ...share,
      entry: entryData,
      createdAt: share.createdAt.toISOString(),
      updatedAt: share.updatedAt.toISOString(),
      expiresAt: share.expiresAt?.toISOString() || null
    }

    return NextResponse.json({
      success: true,
      data: responseData
    })
  } catch (error) {
    console.error('Error fetching share:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch share' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only providers can update shares
    if (!['PROVIDER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id: shareId } = await params
    const body: UpdateShareRequest = await request.json()
    const validatedData = updateShareSchema.parse(body)

    const context = getAuditContext(request, session.user.id)
    const expiresAt = validatedData.expiresAt === null 
      ? null 
      : validatedData.expiresAt 
      ? new Date(validatedData.expiresAt)
      : undefined

    const updates = {
      ...(validatedData.scope && { scope: validatedData.scope }),
      ...(validatedData.message !== undefined && { message: validatedData.message }),
      ...(expiresAt !== undefined && { expiresAt })
    }

    await updateShare(shareId, session.user.id, updates, context)

    return NextResponse.json({
      success: true,
      data: { message: 'Share updated successfully' }
    })
  } catch (error) {
    console.error('Error updating share:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || 'Validation error' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update share'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only providers can revoke shares
    if (!['PROVIDER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id: shareId } = await params
    const body = await request.json()
    const { reason } = revokeShareSchema.parse(body)

    const context = getAuditContext(request, session.user.id)

    await revokeShare(shareId, session.user.id, reason, context)

    return NextResponse.json({
      success: true,
      data: { message: 'Share revoked successfully' }
    })
  } catch (error) {
    console.error('Error revoking share:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || 'Validation error' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to revoke share'
      },
      { status: 500 }
    )
  }
}