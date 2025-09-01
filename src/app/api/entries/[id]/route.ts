import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { createAuditLog, getAuditContext } from '@/lib/security/audit'
import { sanitizeHtml } from '@/lib/security/sanitize'
import type { ApiResponse } from '@/types/api'
import type { Tables } from '@/types/database'

type JournalEntry = Tables<'journal_entries'>

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
  { params }: { params: Promise<{ id: string }> }
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
  { params }: { params: Promise<{ id: string }> }
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

// Delete a journal entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: entryId } = await params

    // Check if entry exists and user owns it
    const existingEntry = await db.journalEntry.findFirst({
      where: {
        id: entryId,
        userId: session.user.id
      },
      select: { id: true, title: true }
    })

    if (!existingEntry) {
      return NextResponse.json(
        { success: false, error: 'Entry not found' },
        { status: 404 }
      )
    }

    await db.journalEntry.delete({
      where: { id: entryId }
    })

    // Audit log
    const context = getAuditContext(request, session.user.id)
    await createAuditLog(
      {
        action: 'DELETE',
        resource: 'journal_entries',
        resourceId: entryId,
        entryId,
        details: { title: existingEntry.title }
      },
      context
    )

    return NextResponse.json({
      success: true,
      data: null,
      message: 'Entry deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting entry:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}