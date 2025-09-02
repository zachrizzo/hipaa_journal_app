'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { EntryDetailLayout } from '@/components/entries/EntryDetailLayout'
import { useRoleBasedAuth } from '@/hooks/useRoleBasedAuth'
import { formatDate, getMoodEmoji, getMoodLabel, renderContent } from '@/lib/entryUtils'
import { entriesService } from '@/services'
import { Edit, Share, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { JournalEntry } from '@/types/database'

interface ViewEntryPageProps {
  params: Promise<{ id: string }>
}

export default function ViewEntryPage({ params }: ViewEntryPageProps): React.JSX.Element {
  const { session, isLoading: authLoading, handleSignOut } = useRoleBasedAuth({ requiredRole: 'CLIENT' })
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [entryId, setEntryId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState('')
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    params.then(resolvedParams => {
      setEntryId(resolvedParams.id)
    })
  }, [params])


  const fetchEntry = useCallback(async (): Promise<void> => {
    if (!entryId) return
    
    setIsLoading(true)
    setError('')

    try {
      const entry = await entriesService.getEntryById(entryId)
      if (!entry) {
        throw new Error('Entry not found')
      }
      setEntry(entry)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [entryId])

  const handleDeleteEntry = async (): Promise<void> => {
    if (!entryId) return

    setIsDeleting(true)
    setDeleteError('')
    setDeleteSuccess('')

    try {
      await entriesService.deleteEntry(entryId)
      setDeleteSuccess('Entry deleted successfully!')

      // Redirect to client dashboard after a short delay
      setTimeout(() => {
        window.location.href = '/client'
      }, 2000)

    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete entry')
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    if (entryId) {
      fetchEntry()
    }
  }, [entryId, fetchEntry])

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (status) {
      case 'PUBLISHED':
        return 'default'
      case 'DRAFT':
        return 'secondary'
      case 'ARCHIVED':
        return 'outline'
      default:
        return 'outline'
    }
  }

  if (error) {
    return (
      <EntryDetailLayout
        session={session}
        isLoading={authLoading}
        onSignOut={handleSignOut}
        backUrl="/client"
        backText="Back to Dashboard"
        title="Error Loading Entry"
      >
        <Card className='shadow-lg border-0 bg-white/90 backdrop-blur-sm'>
          <CardContent className='p-8'>
            <Alert variant="destructive">
              <AlertTitle>Error Loading Entry</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </EntryDetailLayout>
    )
  }

  if (!entry) {
    return (
      <EntryDetailLayout
        session={session}
        isLoading={authLoading}
        onSignOut={handleSignOut}
        backUrl="/client"
        backText="Back to Dashboard"
        title={isLoading ? "Loading..." : "Entry Not Found"}
      >
        <Card className='shadow-lg border-0 bg-white/90 backdrop-blur-sm'>
          <CardContent className='p-8'>
            {isLoading ? (
              <Alert>
                <AlertTitle>Loading Entry...</AlertTitle>
                <AlertDescription>Please wait while we fetch your journal entry.</AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTitle>Entry Not Found</AlertTitle>
                <AlertDescription>The journal entry you&apos;re looking for could not be found.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </EntryDetailLayout>
    )
  }

  const headerActions = (
    <div className='flex items-center space-x-2'>
      <Button variant="outline" size="sm" asChild>
        <Link href={`/client/entries/${entry.id}/edit`}>
          <Edit className='w-4 h-4 mr-2' />
          Edit
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href={`/client/entries/${entry.id}/share`}>
          <Share className='w-4 h-4 mr-2' />
          Share
        </Link>
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 className='w-4 h-4 mr-2' />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Journal Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this journal entry? This action cannot be undone.
              All related data including shares and versions will also be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEntry}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Entry'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )

  return (
    <EntryDetailLayout
      session={session}
      isLoading={authLoading || isLoading}
      onSignOut={handleSignOut}
      backUrl="/client"
      backText="Back to Dashboard"
      title={entry.title || 'Journal Entry'}
      description={`${entry.status.toLowerCase()} entry • ${entry.wordCount} words`}
      headerActions={headerActions}
    >
      <Card className='shadow-lg border-0 bg-white/90 backdrop-blur-sm'>
        <CardContent className='p-6'>
          {/* Delete Success/Error Messages */}
          {deleteError && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}

          {deleteSuccess && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <AlertDescription>
                <Text variant="success">{deleteSuccess}</Text>
              </AlertDescription>
            </Alert>
          )}

          {/* Entry Status and Metadata */}
          <div className='flex items-center space-x-4 mb-6'>
            <Badge variant={getStatusVariant(entry.status)}>
              {entry.status.toLowerCase()}
            </Badge>
            <Text size="sm" variant="muted">📝 {entry.wordCount} words</Text>
            <Text size="sm" variant="muted">🕒 {formatDate(entry.updatedAt)}</Text>
            {entry.publishedAt && (
              <Text size="sm" variant="muted">📅 Published: {formatDate(entry.publishedAt)}</Text>
            )}
          </div>

          {/* Content */}
          <div className='mb-6'>
            <div className='prose max-w-none'>
              <Text as='div' className='whitespace-pre-wrap leading-relaxed'>
                {renderContent(entry.content)}
              </Text>
            </div>
          </div>

          {/* AI Summary */}
          {entry.aiSummary && (
            <div className='mb-6 p-4 bg-primary/5 rounded-lg'>
              <Heading size="sm" variant="default" as="h3" className='mb-2'>AI Summary</Heading>
              <Text size="sm" variant="muted" className='mb-1'>{entry.aiSummary}</Text>
              {entry.aiSummaryAt && (
                <Text size="xs" variant="muted">
                  Generated: {formatDate(entry.aiSummaryAt)}
                </Text>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
            {/* Mood */}
            {entry.mood && (
              <div>
                <Heading size="sm" variant="default" as="h3" className='mb-2'>Mood</Heading>
                <div className='flex items-center space-x-2'>
                  <Text size="xl" className='text-2xl'>{getMoodEmoji(entry.mood)}</Text>
                  <Text size="sm" variant="muted">
                    {entry.mood}/10 - {getMoodLabel(entry.mood)}
                  </Text>
                </div>
              </div>
            )}

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <div>
                <Heading size="sm" variant="default" as="h3" className='mb-2'>Tags</Heading>
                <div className='flex flex-wrap gap-1'>
                  {entry.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className='text-xs'>
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className='pt-4 border-t border-border'>
            <div className='flex justify-between'>
              <Text size="xs" variant="muted">Created: {formatDate(entry.createdAt)}</Text>
              <Text size="xs" variant="muted">Modified: {formatDate(entry.updatedAt)}</Text>
            </div>
          </div>
        </CardContent>
      </Card>
    </EntryDetailLayout>
  )
}