import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateEntrySummary, validateSummaryContent } from '@/lib/ai/summarizer'
import { toPlainText } from '@/lib/utils/tiptap-parser'
import { createAuditLog, getAuditContext } from '@/lib/security/audit'
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit'
import type { ApiResponse, GenerateSummaryResponse } from '@/types/api'

interface RouteParams {
  params: Promise<{ id: string }>
}

const requestSchema = z.object({
  saveToDatabase: z.boolean().optional().default(false)
})

/**
 * Generate or retrieve a summary for a single journal entry
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<GenerateSummaryResponse>>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Apply rate limiting based on user ID
    const rateLimitResult = await rateLimit(
      request,
      RATE_LIMITS.summaryGeneration,
      'summary',
      () => `summary:${session.user.id}` // Custom key generator using user ID
    )

    if (!rateLimitResult.allowed) {
      const resetDate = new Date(rateLimitResult.resetTime)
      return NextResponse.json(
        { 
          success: false, 
          error: `Rate limit exceeded. Try again at ${resetDate.toLocaleTimeString()}`,
          details: { 
            remaining: rateLimitResult.remaining, 
            resetTime: rateLimitResult.resetTime 
          }
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(RATE_LIMITS.summaryGeneration.max),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.resetTime),
          }
        }
      )
    }

    const { id: entryId } = await params
    const { saveToDatabase } = requestSchema.parse(await request.json())

    // Get entry with access check
    const entry = await db.journalEntry.findFirst({
      where: {
        id: entryId,
        OR: [
          { userId: session.user.id },
          {
            shares: {
              some: {
                OR: [
                  { clientId: session.user.id },
                  { providerId: session.user.id }
                ],
                scope: { in: ['SUMMARY_ONLY', 'FULL_ACCESS'] },
                isRevoked: false
              }
            }
          }
        ]
      }
    })

    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'Entry not found or access denied' },
        { status: 404 }
      )
    }

    // Check if we have a saved summary (if requested)
    if (!saveToDatabase && entry.aiSummary) {
      return NextResponse.json({
        success: true,
        data: {
          summary: entry.aiSummary,
          wordCount: entry.aiSummary.split(' ').length,
          generatedAt: entry.aiSummaryAt?.toISOString() || new Date().toISOString()
        }
      })
    }

    // Generate new summary with timeout
    // Prefer TipTap JSON content over contentHtml for more accurate text extraction
    const textContent = toPlainText(entry.content ?? entry.contentHtml ?? 'No content available')
    
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Summary generation timed out after 45 seconds')), 45000)
    )
    
    // Race between summary generation and timeout
    const summaryResult = await Promise.race([
      generateEntrySummary(
        entry.title,
        textContent,
        entry.mood,
        entry.tags
      ),
      timeoutPromise
    ])

    // Validate summary doesn't contain PHI
    if (!validateSummaryContent(summaryResult.summary)) {
      throw new Error('Generated summary contains potentially identifying information')
    }

    // Optionally save to database
    if (saveToDatabase) {
      await db.journalEntry.update({
        where: { id: entryId },
        data: {
          aiSummary: summaryResult.summary,
          aiSummaryAt: new Date()
        }
      })
    }

    // Audit log
    const context = getAuditContext(request, session.user.id)
    await createAuditLog(
      {
        action: 'CREATE',
        resource: 'ai_summary',
        resourceId: entryId,
        entryId,
        details: {
          savedToDb: saveToDatabase,
          wordCount: summaryResult.wordCount
        }
      },
      context
    )

    return NextResponse.json({
      success: true,
      data: {
        summary: summaryResult.summary,
        wordCount: summaryResult.wordCount,
        generatedAt: summaryResult.generatedAt.toISOString()
      }
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate summary'
      },
      { status: 500 }
    )
  }
}

/**
 * Get existing summary for an entry
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<GenerateSummaryResponse | null>>> {
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
        OR: [
          { userId: session.user.id },
          {
            shares: {
              some: {
                OR: [
                  { clientId: session.user.id },
                  { providerId: session.user.id }
                ],
                scope: { in: ['SUMMARY_ONLY', 'FULL_ACCESS'] },
                isRevoked: false
              }
            }
          }
        ]
      },
      select: {
        aiSummary: true,
        aiSummaryAt: true
      }
    })

    if (!entry || !entry.aiSummary) {
      return NextResponse.json({
        success: true,
        data: null
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: entry.aiSummary,
        wordCount: entry.aiSummary.split(' ').length,
        generatedAt: entry.aiSummaryAt?.toISOString() || new Date().toISOString()
      }
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch summary' },
      { status: 500 }
    )
  }
}