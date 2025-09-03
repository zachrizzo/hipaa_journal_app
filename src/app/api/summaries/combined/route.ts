import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateEntrySummary, validateSummaryContent, generateCombinedSummary } from '@/lib/ai/summarizer'
import { createAuditLog, getAuditContext } from '@/lib/security/audit'
import type { ApiResponse } from '@/types/api'

interface HierarchicalSummary {
  level: 'individual' | 'group' | 'combined'
  summary: string
  entryIds: string[]
  wordCount: number
  dateRange?: {
    start: string
    end: string
  }
}

interface CombinedSummaryResponse {
  // Top-level combined summary
  finalSummary: string
  
  // Hierarchical tree of summaries
  hierarchicalSummaries: HierarchicalSummary[]
  
  // Metadata
  totalEntries: number
  hierarchyLevels: number
  dateRange: {
    start: string
    end: string
  }
  generatedAt: string
}

const requestSchema = z.object({
  entryIds: z.array(z.string()).min(2, 'At least 2 entries required for combination'),
  groupSize: z.number().min(2).max(10).optional().default(3), // Group entries in batches
  saveIndividualSummaries: z.boolean().optional().default(true)
})

/**
 * Generate hierarchical combined summaries using reverse tree structure
 * Individual -> Group -> Final Combined Summary
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CombinedSummaryResponse>>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { entryIds, groupSize, saveIndividualSummaries } = requestSchema.parse(await request.json())

    // Fetch all entries
    const entries = await db.journalEntry.findMany({
      where: {
        id: { in: entryIds },
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
      orderBy: { createdAt: 'asc' }
    })

    if (entries.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Not enough accessible entries found' },
        { status: 400 }
      )
    }

    const hierarchicalSummaries: HierarchicalSummary[] = []
    
    // Level 1: Generate individual summaries
    const individualSummaries = await Promise.all(
      entries.map(async (entry) => {
        // Check if summary exists
        if (entry.aiSummary) {
          return {
            entryId: entry.id,
            summary: entry.aiSummary,
            wordCount: entry.aiSummary.split(' ').length,
            createdAt: entry.createdAt
          }
        }

        // Generate new summary
        const textContent = entry.contentHtml || JSON.stringify(entry.content)
        const result = await generateEntrySummary(
          entry.title,
          textContent,
          entry.mood,
          entry.tags
        )

        // Validate PHI
        if (!validateSummaryContent(result.summary)) {
          result.summary = '[Summary contains PHI - redacted]'
        }

        // Optionally save
        if (saveIndividualSummaries) {
          await db.journalEntry.update({
            where: { id: entry.id },
            data: {
              aiSummary: result.summary,
              aiSummaryAt: new Date()
            }
          })
        }

        return {
          entryId: entry.id,
          summary: result.summary,
          wordCount: result.wordCount,
          createdAt: entry.createdAt
        }
      })
    )

    // Add individual summaries to hierarchy
    individualSummaries.forEach(item => {
      hierarchicalSummaries.push({
        level: 'individual',
        summary: item.summary,
        entryIds: [item.entryId],
        wordCount: item.wordCount
      })
    })

    // Level 2 + 3: Use LLM for group summaries and final combined summary
    const groupSummaries: string[] = []
    for (let i = 0; i < individualSummaries.length; i += groupSize) {
      const group = individualSummaries.slice(i, i + groupSize)
      const llmGroup = await generateCombinedSummary(
        group.map(g => ({ entryId: g.entryId, title: '', summary: g.summary })),
        'custom'
      )
      const groupSummary = llmGroup.summary
      groupSummaries.push(groupSummary)
      hierarchicalSummaries.push({
        level: 'group',
        summary: groupSummary,
        entryIds: group.map(g => g.entryId),
        wordCount: llmGroup.wordCount
      })
    }

    const finalCombined = await generateCombinedSummary(
      individualSummaries.map(g => ({ entryId: g.entryId, title: '', summary: g.summary })),
      'custom',
      { dateRange: { start: entries[0].createdAt.toISOString(), end: entries[entries.length - 1].createdAt.toISOString() } }
    )
    const finalSummary = finalCombined.summary
    
    hierarchicalSummaries.push({
      level: 'combined',
      summary: finalSummary,
      entryIds: entries.map(e => e.id),
      wordCount: finalCombined.wordCount,
      dateRange: {
        start: entries[0].createdAt.toISOString(),
        end: entries[entries.length - 1].createdAt.toISOString()
      }
    })

    // Calculate date range
    const dateRange = {
      start: entries[0].createdAt.toISOString(),
      end: entries[entries.length - 1].createdAt.toISOString()
    }

    // Audit log
    const context = getAuditContext(request, session.user.id)
    await createAuditLog(
      {
        action: 'CREATE',
        resource: 'combined_summary',
        resourceId: null,
        details: {
          entryCount: entries.length,
          hierarchyLevels: 3,
          savedIndividual: saveIndividualSummaries
        }
      },
      context
    )

    return NextResponse.json({
      success: true,
      data: {
        finalSummary,
        hierarchicalSummaries,
        totalEntries: entries.length,
        hierarchyLevels: 3,
        dateRange,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate combined summary'
      },
      { status: 500 }
    )
  }
}

