'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800'
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800'
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
          <CardContent className='p-8 text-center'>
            <h2 className='text-xl font-semibold text-gray-900 mb-4'>Error Loading Entry</h2>
            <p className='text-red-600 mb-6'>{error}</p>
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
        title="Entry Not Found"
      >
        <Card className='shadow-lg border-0 bg-white/90 backdrop-blur-sm'>
          <CardContent className='p-8 text-center'>
            <h2 className='text-xl font-semibold text-gray-900 mb-4'>Entry Not Found</h2>
            <p className='text-gray-600 mb-6'>The journal entry you&apos;re looking for could not be found.</p>
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
              className="bg-red-600 hover:bg-red-700"
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
              <AlertDescription className="text-green-700">{deleteSuccess}</AlertDescription>
            </Alert>
          )}

          {/* Entry Status and Metadata */}
          <div className='flex items-center space-x-4 text-sm text-gray-600 mb-6'>
            <Badge className={getStatusColor(entry.status)}>
              {entry.status.toLowerCase()}
            </Badge>
            <span>📝 {entry.wordCount} words</span>
            <span>🕒 {formatDate(entry.updatedAt)}</span>
            {entry.publishedAt && (
              <span>📅 Published: {formatDate(entry.publishedAt)}</span>
            )}
          </div>

          {/* Content */}
          <div className='mb-6'>
            <div className='prose max-w-none'>
              <div className='whitespace-pre-wrap text-gray-700 leading-relaxed'>
                {renderContent(entry.content)}
              </div>
            </div>
          </div>

          {/* AI Summary */}
          {entry.aiSummary && (
            <div className='mb-6 p-4 bg-blue-50/80 rounded-lg'>
              <h3 className='text-sm font-medium text-gray-700 mb-2'>AI Summary</h3>
              <p className='text-sm text-gray-600'>{entry.aiSummary}</p>
              {entry.aiSummaryAt && (
                <p className='text-xs text-gray-500 mt-1'>
                  Generated: {formatDate(entry.aiSummaryAt)}
                </p>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
            {/* Mood */}
            {entry.mood && (
              <div>
                <h3 className='text-sm font-medium text-gray-700 mb-2'>Mood</h3>
                <div className='flex items-center space-x-2'>
                  <span className='text-2xl'>{getMoodEmoji(entry.mood)}</span>
                  <span className='text-sm text-gray-600'>
                    {entry.mood}/10 - {getMoodLabel(entry.mood)}
                  </span>
                </div>
              </div>
            )}

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <div>
                <h3 className='text-sm font-medium text-gray-700 mb-2'>Tags</h3>
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
          <div className='pt-4 border-t border-gray-200 text-xs text-gray-500'>
            <div className='flex justify-between'>
              <span>Created: {formatDate(entry.createdAt)}</span>
              <span>Modified: {formatDate(entry.updatedAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </EntryDetailLayout>
  )
}