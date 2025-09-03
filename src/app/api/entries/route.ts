import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { sanitizeHtml } from '@/lib/security/sanitize'
import { calculateWordCount, normalizeTags } from '@/lib/utils/entry-utils'
import { entryAccessibleByUser, paginationParams, entryOrderBy, entrySearchWhere } from '@/lib/db/query-helpers'
import { withAuth } from '@/lib/api/auth-wrapper'
import { apiSuccess, apiPaginated, badRequest, serverError } from '@/lib/api/responses'
import validator from 'validator'
import type { User } from '@prisma/client'

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
export const POST = withAuth(
  async (request: NextRequest, { user }: { params: Record<string, string>; user: User }) => {
    try {
      const body = await request.json()

      // Sanitize scalar inputs; leave TipTap JSON structure intact
      const sanitized = {
        ...body,
        title: validator.escape(validator.trim(String(body.title ?? ''))).substring(0, 200),
        tags: Array.isArray(body.tags)
          ? normalizeTags(body.tags.map((t: unknown) => String(t))).slice(0, 10)
          : []
      }

      const validatedData = createEntrySchema.parse({
        ...sanitized,
        content: body.content // keep original TipTap JSON for validation
      })

      // Calculate word count from content
      const wordCount = calculateWordCount(validatedData.content)
      
      // Serialize content to JSON string for storage
      const contentHtml = JSON.stringify(validatedData.content)
      const sanitizedHtml = sanitizeHtml(contentHtml)
      
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
          userId: user.id,
          publishedAt: validatedData.status === 'PUBLISHED' ? new Date() : null,
        }
      })

      return apiSuccess({ id: entry.id }, 'Entry created successfully', 201)
    } catch (error) {
      console.error('Create entry error:', error)
      if (error instanceof z.ZodError) {
        return badRequest(error.errors[0].message)
      }
      return serverError('Failed to create entry')
    }
  },
  { auditAction: 'CREATE', auditResource: 'journal_entries' }
)

// Get user's journal entries
export const GET = withAuth(
  async (request: NextRequest, { user }: { params: Record<string, string>; user: User }) => {
    try {
      const { searchParams } = new URL(request.url)
      const rawParams = Object.fromEntries(searchParams)
      const parsedParams = {
        ...rawParams,
        search: rawParams.search 
          ? validator.escape(validator.trim(String(rawParams.search))).substring(0, 100) 
          : undefined
      }
      const { page, limit, status, search } = listEntriesSchema.parse(parsedParams)

      // Build where clause
      const baseWhere = entryAccessibleByUser(user.id)
      const whereConditions = [baseWhere]
      
      if (status) {
        whereConditions.push({ status })
      }
      
      if (search) {
        whereConditions.push(entrySearchWhere(search))
      }

      const where = {
        AND: whereConditions
      }

      // Fetch entries and count in parallel
      const [entries, total] = await Promise.all([
        db.journalEntry.findMany({
          where,
          ...paginationParams(page, limit),
          orderBy: entryOrderBy('updatedAt', 'desc'),
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

      return apiPaginated(entries, total, page, limit)
    } catch (error) {
      console.error('List entries error:', error)
      if (error instanceof z.ZodError) {
        return badRequest('Invalid request parameters')
      }
      return serverError('Failed to fetch entries')
    }
  },
  { auditAction: 'READ', auditResource: 'journal_entries' }
)