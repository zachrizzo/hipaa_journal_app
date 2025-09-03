'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { EntryDetailLayout } from '@/components/entries/EntryDetailLayout'
import { Text } from '@/components/ui/text'
import { Heading } from '@/components/ui/heading'
import { useRoleBasedAuth } from '@/hooks/useRoleBasedAuth'
import { formatDate, getMoodEmoji, getMoodLabel, renderContent, getScopeVariant, getScopeLabel } from '@/lib/entryUtils'
import { sharingService } from '@/services'
import type { EntryShareWithRelationsData } from '@/types/database'

interface ViewSharedEntryPageProps {
  params: { id: string }
}

export default function ViewSharedEntryPage({ params }: ViewSharedEntryPageProps): React.JSX.Element {
  const { session, isLoading: authLoading, handleSignOut } = useRoleBasedAuth({ requiredRole: 'PROVIDER' })
  const [shareData, setShareData] = useState<EntryShareWithRelationsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const shareId = params.id


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
          <CardContent className='p-8'>
            <Alert variant="destructive">
              <AlertTitle>Error Loading Shared Entry</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
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
          <CardContent className='p-8'>
            {isLoading ? (
              <Alert>
                <AlertTitle>Loading Shared Entry...</AlertTitle>
                <AlertDescription>Please wait while we fetch the journal entry.</AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTitle>Shared Entry Not Found</AlertTitle>
                <AlertDescription>The shared journal entry you&apos;re looking for could not be found.</AlertDescription>
              </Alert>
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
      <Card className='shadow-lg border-0 bg-primary/5 backdrop-blur-sm mb-6'>
        <CardContent className='p-6'>
          <div className='flex justify-between items-center'>
            <div>
              <Heading as='h2' size='lg'>Shared by Patient</Heading>
              <Text as='div' size='sm' variant='muted'>
                Access Level: <Badge variant={getScopeVariant(shareData.scope)}>
                  {getScopeLabel(shareData.scope)}
                </Badge>
              </Text>
            </div>
            <div className='text-right'>
              <Text as='p' size='sm' variant='muted'>Shared: {formatDate(shareData.createdAt)}</Text>
              {shareData.expiresAt && (
                <Text as='p' size='sm' variant='muted'>Expires: {formatDate(shareData.expiresAt)}</Text>
              )}
            </div>
          </div>
          {shareData.message && (
            <div className='mt-4 p-3 bg-white/80 rounded-md'>
              <Heading as='h3' size='sm' className='mb-1'>Patient Message</Heading>
              <Text as='p' size='sm' variant='muted'>{shareData.message}</Text>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entry Content */}
      <Card className='shadow-lg border-0 bg-white/90 backdrop-blur-sm'>
        <CardContent className='p-6'>
          {/* Entry Metadata */}
          <div className='flex items-center space-x-4 mb-6'>
            <Text size='sm' variant='muted'>📝 {shareData.entry.wordCount} words</Text>
            <Text size='sm' variant='muted'>🕒 {formatDate(shareData.entry.updatedAt)}</Text>
          </div>

          {/* Full Content */}
          {shareData.scope === 'FULL_ACCESS' && shareData.entry.content && (
            <div className='mb-6'>
              <div className='prose max-w-none'>
                <Text as='div' className='whitespace-pre-wrap leading-relaxed'>
                  {renderContent(shareData.entry.content)}
                </Text>
              </div>
            </div>
          )}

          {/* AI Summary */}
          {(shareData.scope === 'FULL_ACCESS' || shareData.scope === 'SUMMARY_ONLY') && shareData.entry.aiSummary && (
            <div className='mb-6 p-4 bg-primary/5 rounded-lg'>
              <Heading as='h3' size='sm' className='mb-2'>AI Summary</Heading>
              <Text as='p' size='sm' variant='muted'>{shareData.entry.aiSummary}</Text>
              {shareData.entry.aiSummaryAt && (
                <Text as='p' size='xs' variant='muted' className='mt-1'>
                  Generated: {formatDate(shareData.entry.aiSummaryAt)}
                </Text>
              )}
            </div>
          )}

          {/* Metadata */}
          {(shareData.scope === 'FULL_ACCESS' || shareData.scope === 'SUMMARY_ONLY') && (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
              {/* Mood */}
              {shareData.entry.mood && (
                <div>
                  <Heading as='h3' size='sm' className='mb-2'>Mood</Heading>
                  <div className='flex items-center space-x-2'>
                    <Text className='text-2xl'>{getMoodEmoji(shareData.entry.mood)}</Text>
                    <Text size='sm' variant='muted'>
                      {shareData.entry.mood}/10 - {getMoodLabel(shareData.entry.mood)}
                    </Text>
                  </div>
                </div>
              )}

              {/* Tags */}
              {shareData.entry.tags && shareData.entry.tags.length > 0 && (
                <div>
                  <Heading as='h3' size='sm' className='mb-2'>Tags</Heading>
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
            <div className='text-center py-8'>
              <Text as='p' variant='muted'>This entry was shared with &quot;Title Only&quot; access. Contact the patient for additional details if needed.</Text>
            </div>
          )}

          {/* Timestamps */}
          <div className='pt-4 border-t border-border'>
            <div className='flex justify-between'>
              <Text size='xs' variant='muted'>Created: {formatDate(shareData.entry.createdAt)}</Text>
              <Text size='xs' variant='muted'>Modified: {formatDate(shareData.entry.updatedAt)}</Text>
            </div>
          </div>
        </CardContent>
      </Card>
    </EntryDetailLayout>
  )
}