import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { createAuditLog, getAuditContext } from '@/lib/security/audit'
import { sanitizeHtml } from '@/lib/security/sanitize'
import validator from 'validator'
import type { ApiResponse, EntriesListResponse } from '@/types/api'
import type { Prisma } from '@prisma/client'
import type { JournalEntry } from '@/types/database'




const createEntrySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  content: z.object({}).passthrough(), // TipTap JSON content
  mood: z.number().min(1).max(10).optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').default([]),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT')
})

const listEntriesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  search: z.string().optional()
})

// Create a new journal entry
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Pick<JournalEntry, 'id'>>>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Sanitize scalar inputs; leave TipTap JSON structure intact
    const sanitized = {
      ...body,
      title: validator.escape(validator.trim(String(body.title ?? ''))).substring(0, 200),
      tags: Array.isArray(body.tags)
        ? body.tags.map((t: unknown) => validator.escape(validator.trim(String(t))).substring(0, 40)).slice(0, 10)
        : []
    }

    const validatedData = createEntrySchema.parse({
      ...sanitized,
      content: body.content // keep original TipTap JSON for validation by Zod + our own validator
    })

    // Serialize content to HTML-like string for storage and sanitize
    const contentHtml = JSON.stringify(validatedData.content)
    const sanitizedHtml = sanitizeHtml(contentHtml)

    // Calculate word count by extracting text tokens
    const wordCount = JSON.stringify(validatedData.content)
      .replace(/<[^>]*>/g, ' ')
      .replace(/[^A-Za-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .length
    
    // Create the entry
    const entry = await db.journalEntry.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        contentHtml: sanitizedHtml,
        mood: validatedData.mood,
        tags: validatedData.tags,
        status: validatedData.status,
        wordCount,
        userId: session.user.id,
        publishedAt: validatedData.status === 'PUBLISHED' ? new Date() : null,
        // Initialize analysis fields will be computed later
      }
    })

    // Audit log
    const context = getAuditContext(request, session.user.id)
    await createAuditLog(
      {
        action: 'CREATE',
        resource: 'journal_entries',
        resourceId: entry.id,
        entryId: entry.id,
        details: { 
          title: entry.title, 
          status: entry.status,
          wordCount: entry.wordCount 
        }
      },
      context
    )

    return NextResponse.json(
      { success: true, data: { id: entry.id }, message: 'Entry created successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating entry:', error)
    
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

// Get user's journal entries
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<EntriesListResponse>>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const rawParams = Object.fromEntries(searchParams)
    const parsedParams = {
      ...rawParams,
      status: rawParams.status,
      search: rawParams.search ? validator.escape(validator.trim(String(rawParams.search))).substring(0, 100) : undefined
    }
    const { page, limit, status, search } = listEntriesSchema.parse(parsedParams)

    const where: Prisma.JournalEntryWhereInput = {
      userId: session.user.id
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { tags: { hasSome: [search.toLowerCase()] } }
      ]
    }

    // Debug logging
    console.log('Search query:', { search, status, where })

    const [entries, total] = await Promise.all([
      db.journalEntry.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          content: false, // Don't include full content in list
          mood: true,
          tags: true,
          status: true,
          wordCount: true,
          createdAt: true,
          updatedAt: true,
          publishedAt: true,
          aiSummary: true,
          aiSummaryAt: true,
        }
      }),
      db.journalEntry.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    // Audit log
    const context = getAuditContext(request, session.user.id)
    await createAuditLog(
      {
        action: 'READ',
        resource: 'journal_entries',
        details: { 
          page, 
          limit, 
          status, 
          search, 
          resultsCount: entries.length 
        }
      },
      context
    )

    return NextResponse.json({
      success: true,
      data: {
        entries: entries.map(entry => ({
          id: entry.id,
          title: entry.title,
          status: entry.status,
          mood: entry.mood,
          tags: entry.tags,
          wordCount: entry.wordCount,
          createdAt: entry.createdAt.toISOString(),
          updatedAt: entry.updatedAt.toISOString(),
          publishedAt: entry.publishedAt?.toISOString() || null,
          aiSummary: entry.aiSummary,
          aiSummaryAt: entry.aiSummaryAt?.toISOString() || null,
        })),
        total,
        page,
        totalPages
      }
    })
  } catch (error) {
    console.error('Error fetching entries:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}