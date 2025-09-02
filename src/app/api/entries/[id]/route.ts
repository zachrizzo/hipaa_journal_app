import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { createAuditLog, getAuditContext } from '@/lib/security/audit'
import { sanitizeHtml } from '@/lib/security/sanitize'
import type { ApiResponse } from '@/types/api'
import type { JournalEntry } from '@/types/database'

interface RouteParams {
  params: Promise<Record<'id', string>>
}

const updateEntrySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters').optional(),
  content: z.object({}).passthrough().optional(),
  mood: z.number().min(1).max(10).optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional()
})

// Get a specific journal entry
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<JournalEntry>>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: entryId } = await params

    const entry = await db.journalEntry.findFirst({
      where: {
        id: entryId,
        userId: session.user.id
      }
    })

    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'Entry not found' },
        { status: 404 }
      )
    }

    // Audit log
    const context = getAuditContext(request, session.user.id)
    await createAuditLog(
      {
        action: 'READ',
        resource: 'journal_entries',
        resourceId: entryId,
        entryId,
        details: { title: entry.title }
      },
      context
    )

    return NextResponse.json({
      success: true,
      data: entry as JournalEntry
    })
  } catch (error) {
    console.error('Error fetching entry:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update a journal entry
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<JournalEntry>>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: entryId } = await params
    const body = await request.json()
    const validatedData = updateEntrySchema.parse(body)

    // Check if entry exists and user owns it
    const existingEntry = await db.journalEntry.findFirst({
      where: {
        id: entryId,
        userId: session.user.id
      }
    })

    if (!existingEntry) {
      return NextResponse.json(
        { success: false, error: 'Entry not found' },
        { status: 404 }
      )
    }

    const updateData: Parameters<typeof db.journalEntry.update>[0]['data'] = {
      ...validatedData,
      updatedAt: new Date()
    }

    // Handle content update
    if (validatedData.content) {
      const contentHtml = JSON.stringify(validatedData.content)
      const sanitizedHtml = await sanitizeHtml(contentHtml)
      updateData.contentHtml = sanitizedHtml
      updateData.wordCount = contentHtml.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length
    }

    // Handle status change to published
    if (validatedData.status === 'PUBLISHED' && existingEntry.status !== 'PUBLISHED') {
      updateData.publishedAt = new Date()
    } else if (validatedData.status === 'DRAFT' && existingEntry.status === 'PUBLISHED') {
      updateData.publishedAt = null
    }

    const updatedEntry = await db.journalEntry.update({
      where: { id: entryId },
      data: updateData
    })

    // Audit log
    const context = getAuditContext(request, session.user.id)
    await createAuditLog(
      {
        action: 'UPDATE',
        resource: 'journal_entries',
        resourceId: entryId,
        entryId,
        details: { 
          changes: Object.keys(validatedData),
          title: updatedEntry.title 
        }
      },
      context
    )

    return NextResponse.json({
      success: true,
      data: updatedEntry as JournalEntry
    })
  } catch (error) {
    console.error('Error updating entry:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || 'Validation error' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete a journal entry and all related data
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<{ deletedShares: number; deletedVersions: number; preservedAuditLogs: number }>>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: entryId } = await params

    // Check if entry exists and user owns it, also get related data counts
    const existingEntry = await db.journalEntry.findFirst({
      where: {
        id: entryId,
        userId: session.user.id
      },
      select: {
        id: true,
        title: true,
        status: true,
        _count: {
          select: {
            shares: true,
            versions: true,
            auditLogs: true
          }
        }
      }
    })

    if (!existingEntry) {
      return NextResponse.json(
        { success: false, error: 'Entry not found' },
        { status: 404 }
      )
    }

    const context = getAuditContext(request, session.user.id)

    // Audit log BEFORE deletion (for compliance)
    await createAuditLog(
      {
        action: 'DELETE',
        resource: 'journal_entries',
        resourceId: entryId,
        entryId,
        details: {
          title: existingEntry.title,
          status: existingEntry.status,
          sharesCount: existingEntry._count.shares,
          versionsCount: existingEntry._count.versions,
          auditLogsCount: existingEntry._count.auditLogs,
          deletionReason: 'User requested deletion'
        }
      },
      context
    )

    // Delete the entry (this will cascade to versions and shares due to onDelete: Cascade)
    await db.journalEntry.delete({
      where: { id: entryId }
    })

    // Note: Audit logs for the entry are preserved for compliance
    // They remain in the database but with entryId still pointing to the deleted entry

    return NextResponse.json(
      {
        success: true,
        message: 'Entry and all related data deleted successfully',
        data: {
          deletedShares: existingEntry._count.shares,
          deletedVersions: existingEntry._count.versions,
          preservedAuditLogs: existingEntry._count.auditLogs
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting entry:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}