'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EntryDetailLayout } from '@/components/entries/EntryDetailLayout'
import { useRoleBasedAuth } from '@/hooks/useRoleBasedAuth'
import { formatDate, getMoodEmoji, getMoodLabel, renderContent, getScopeColor, getScopeLabel } from '@/lib/entryUtils'
import { sharingService } from '@/services'
import type { EntryShareWithRelations } from '@/types/database'

interface ViewSharedEntryPageProps {
  params: Promise<{ id: string }>
}

// Use generated type instead of manual interface
type SharedEntryData = EntryShareWithRelations

export default function ViewSharedEntryPage({ params }: ViewSharedEntryPageProps): React.JSX.Element {
  const { session, isLoading: authLoading, handleSignOut } = useRoleBasedAuth({ requiredRole: 'PROVIDER' })
  const [shareData, setShareData] = useState<SharedEntryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [shareId, setShareId] = useState<string | null>(null)

  useEffect(() => {
    params.then(resolvedParams => {
      setShareId(resolvedParams.id)
    })
  }, [params])


  const fetchSharedEntry = useCallback(async (): Promise<void> => {
    if (!shareId) return
    
    setIsLoading(true)
    setError('')

    try {
      const shareData = await sharingService.getShareById(shareId)
      if (!shareData) {
        throw new Error('Shared entry not found')
      }
      setShareData(shareData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [shareId])

  useEffect(() => {
    if (shareId && session) {
      fetchSharedEntry()
    }
  }, [shareId, session, fetchSharedEntry])

  if (error) {
    return (
      <EntryDetailLayout
        session={session}
        isLoading={authLoading}
        onSignOut={handleSignOut}
        backUrl="/provider"
        backText="Back to Dashboard"
        title="Error Loading Entry"
      >
        <Card className='shadow-lg border-0 bg-white/90 backdrop-blur-sm'>
          <CardContent className='p-8 text-center'>
            <h2 className='text-xl font-semibold text-gray-900 mb-4'>Error Loading Shared Entry</h2>
            <p className='text-red-600 mb-6'>{error}</p>
          </CardContent>
        </Card>
      </EntryDetailLayout>
    )
  }

  if (!shareData) {
    return (
      <EntryDetailLayout
        session={session}
        isLoading={authLoading || isLoading}
        onSignOut={handleSignOut}
        backUrl="/provider"
        backText="Back to Dashboard" 
        title={isLoading ? "Loading..." : "Entry Not Found"}
      >
        <Card className='shadow-lg border-0 bg-white/90 backdrop-blur-sm'>
          <CardContent className='p-8 text-center'>
            {isLoading ? (
              <>
                <h2 className='text-xl font-semibold text-gray-900 mb-4'>Loading Shared Entry...</h2>
                <p className='text-gray-600 mb-6'>Please wait while we fetch the journal entry.</p>
              </>
            ) : (
              <>
                <h2 className='text-xl font-semibold text-gray-900 mb-4'>Shared Entry Not Found</h2>
                <p className='text-gray-600 mb-6'>The shared journal entry you&apos;re looking for could not be found.</p>
              </>
            )}
          </CardContent>
        </Card>
      </EntryDetailLayout>
    )
  }

  return (
    <EntryDetailLayout
      session={session}
      isLoading={authLoading || isLoading}
      onSignOut={handleSignOut}
      backUrl="/provider"
      backText="Back to Dashboard"
      title={shareData.entry.title || 'Shared Entry'}
      description={`Shared by patient with ${getScopeLabel(shareData.scope)} access`}
    >
      {/* Share Information Header */}
      <Card className='shadow-lg border-0 bg-blue-50/80 backdrop-blur-sm mb-6'>
        <CardContent className='p-6'>
          <div className='flex justify-between items-center'>
            <div>
              <h2 className='text-lg font-semibold text-gray-900'>Shared by Patient</h2>
              <div className='text-sm text-gray-600'>
                Access Level: <Badge className={getScopeColor(shareData.scope)}>
                  {getScopeLabel(shareData.scope)}
                </Badge>
              </div>
            </div>
            <div className='text-right text-sm text-gray-600'>
              <p>Shared: {formatDate(shareData.createdAt)}</p>
              {shareData.expiresAt && (
                <p>Expires: {formatDate(shareData.expiresAt)}</p>
              )}
            </div>
          </div>
          {shareData.message && (
            <div className='mt-4 p-3 bg-white/80 rounded-md'>
              <h3 className='text-sm font-medium text-gray-700 mb-1'>Patient Message</h3>
              <p className='text-sm text-gray-600'>{shareData.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entry Content */}
      <Card className='shadow-lg border-0 bg-white/90 backdrop-blur-sm'>
        <CardContent className='p-6'>
          {/* Entry Metadata */}
          <div className='flex items-center space-x-4 text-sm text-gray-600 mb-6'>
            <span>📝 {shareData.entry.wordCount} words</span>
            <span>🕒 {formatDate(shareData.entry.updatedAt)}</span>
          </div>

          {/* Full Content */}
          {shareData.scope === 'FULL_ACCESS' && shareData.entry.content && (
            <div className='mb-6'>
              <div className='prose max-w-none'>
                <div className='whitespace-pre-wrap text-gray-700 leading-relaxed'>
                  {renderContent(shareData.entry.content)}
                </div>
              </div>
            </div>
          )}

          {/* AI Summary */}
          {(shareData.scope === 'FULL_ACCESS' || shareData.scope === 'SUMMARY_ONLY') && shareData.entry.aiSummary && (
            <div className='mb-6 p-4 bg-blue-50/80 rounded-lg'>
              <h3 className='text-sm font-medium text-gray-700 mb-2'>AI Summary</h3>
              <p className='text-sm text-gray-600'>{shareData.entry.aiSummary}</p>
              {shareData.entry.aiSummaryAt && (
                <p className='text-xs text-gray-500 mt-1'>
                  Generated: {formatDate(shareData.entry.aiSummaryAt)}
                </p>
              )}
            </div>
          )}

          {/* Metadata */}
          {(shareData.scope === 'FULL_ACCESS' || shareData.scope === 'SUMMARY_ONLY') && (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
              {/* Mood */}
              {shareData.entry.mood && (
                <div>
                  <h3 className='text-sm font-medium text-gray-700 mb-2'>Mood</h3>
                  <div className='flex items-center space-x-2'>
                    <span className='text-2xl'>{getMoodEmoji(shareData.entry.mood)}</span>
                    <span className='text-sm text-gray-600'>
                      {shareData.entry.mood}/10 - {getMoodLabel(shareData.entry.mood)}
                    </span>
                  </div>
                </div>
              )}

              {/* Tags */}
              {shareData.entry.tags && shareData.entry.tags.length > 0 && (
                <div>
                  <h3 className='text-sm font-medium text-gray-700 mb-2'>Tags</h3>
                  <div className='flex flex-wrap gap-1'>
                    {shareData.entry.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className='text-xs'>
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {shareData.scope === 'TITLE_ONLY' && (
            <div className='text-center text-gray-500 py-8'>
              <p>This entry was shared with &quot;Title Only&quot; access. Contact the patient for additional details if needed.</p>
            </div>
          )}

          {/* Timestamps */}
          <div className='pt-4 border-t border-gray-200 text-xs text-gray-500'>
            <div className='flex justify-between'>
              <span>Created: {formatDate(shareData.entry.createdAt)}</span>
              <span>Modified: {formatDate(shareData.entry.updatedAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </EntryDetailLayout>
  )
}