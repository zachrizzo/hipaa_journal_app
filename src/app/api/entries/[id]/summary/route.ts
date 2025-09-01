import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateEntrySummary, validateSummaryContent } from '@/lib/ai/summarizer'
import { createAuditLog, getAuditContext } from '@/lib/security/audit'
import type { ApiResponse, GenerateSummaryResponse } from '@/types/api'

const generateSummarySchema = z.object({
  forceRegenerate: z.boolean().optional().default(false),
  includeMoodAnalysis: z.boolean().optional().default(false)
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<GenerateSummaryResponse>>> {
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
    const { forceRegenerate, includeMoodAnalysis } = generateSummarySchema.parse(body)

    // Get the journal entry
    const entry = await db.journalEntry.findFirst({
      where: {
        id: entryId,
        OR: [
          { userId: session.user.id },
          {
            shares: {
              some: {
                clientId: session.user.id,
                scope: { in: ['SUMMARY_ONLY', 'FULL_ACCESS'] },
                isRevoked: false,
                OR: [
                  { expiresAt: null },
                  { expiresAt: { gt: new Date() } }
                ]
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

    // Check if summary already exists and force regenerate is false
    if (entry.aiSummary && !forceRegenerate) {
      const context = getAuditContext(request, session.user.id)
      
      await createAuditLog(
        {
          action: 'READ',
          resource: 'ai_summary',
          resourceId: entryId,
          entryId,
          details: { cached: true }
        },
        context
      )

      return NextResponse.json({
        success: true,
        data: {
          summary: entry.aiSummary,
          wordCount: entry.aiSummary.split(' ').length,
          generatedAt: entry.aiSummaryAt?.toISOString() || new Date().toISOString()
        }
      })
    }

    // Extract content from TipTap JSON
    const contentHtml = entry.contentHtml || ''
    
    // Generate AI summary
    const summaryResult = await generateEntrySummary(
      entry.title,
      contentHtml,
      entry.mood,
      entry.tags,
      { includeMoodAnalysis }
    )

    // Validate the generated summary doesn't contain identifying information
    if (!validateSummaryContent(summaryResult.summary)) {
      throw new Error('Generated summary contains potentially identifying information')
    }

    // Check for risk flags
    if (summaryResult.riskFlags.includes('CLINICAL_REVIEW_REQUIRED')) {
      // In production, this would trigger an alert to healthcare providers
      console.warn(`Clinical review required for entry ${entryId}`)
      
      // Audit the risk detection
      const context = getAuditContext(request, session.user.id)
      await createAuditLog(
        {
          action: 'CREATE',
          resource: 'ai_summary',
          resourceId: entryId,
          entryId,
          details: { 
            riskDetected: true, 
            flags: summaryResult.riskFlags,
            requiresReview: true
          }
        },
        context
      )
    }

    // Update the entry with the new summary
    await db.journalEntry.update({
      where: { id: entryId },
      data: {
        aiSummary: summaryResult.summary,
        aiSummaryAt: summaryResult.generatedAt
      }
    })

    // Audit the AI summary generation
    const context = getAuditContext(request, session.user.id)
    await createAuditLog(
      {
        action: 'CREATE',
        resource: 'ai_summary',
        resourceId: entryId,
        entryId,
        details: {
          wordCount: summaryResult.wordCount,
          keyThemes: summaryResult.keyThemes,
          riskFlags: summaryResult.riskFlags,
          includedMoodAnalysis: includeMoodAnalysis
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
    console.error('Error generating AI summary:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate summary'
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Get the journal entry with existing summary
    const entry = await db.journalEntry.findFirst({
      where: {
        id: entryId,
        OR: [
          { userId: session.user.id },
          {
            shares: {
              some: {
                clientId: session.user.id,
                scope: { in: ['SUMMARY_ONLY', 'FULL_ACCESS'] },
                isRevoked: false,
                OR: [
                  { expiresAt: null },
                  { expiresAt: { gt: new Date() } }
                ]
              }
            }
          }
        ]
      },
      select: {
        id: true,
        aiSummary: true,
        aiSummaryAt: true
      }
    })

    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'Entry not found or access denied' },
        { status: 404 }
      )
    }

    if (!entry.aiSummary) {
      return NextResponse.json({
        success: true,
        data: null
      })
    }

    // Audit the summary access
    const context = getAuditContext(request, session.user.id)
    await createAuditLog(
      {
        action: 'READ',
        resource: 'ai_summary',
        resourceId: entryId,
        entryId
      },
      context
    )

    return NextResponse.json({
      success: true,
      data: {
        summary: entry.aiSummary,
        wordCount: entry.aiSummary.split(' ').length,
        generatedAt: entry.aiSummaryAt?.toISOString() || new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching AI summary:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch summary' },
      { status: 500 }
    )
  }
}