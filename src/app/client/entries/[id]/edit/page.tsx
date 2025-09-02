'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { JournalEntryForm } from '@/components/forms/JournalEntryForm'
import { EntryDetailLayout } from '@/components/entries/EntryDetailLayout'
import { useRoleBasedAuth } from '@/hooks/useRoleBasedAuth'
import { entriesService } from '@/services'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Edit } from 'lucide-react'
import type { JournalEntry, CreateEntryInput } from '@/types/database'

interface EditEntryPageProps {
  params: Promise<{ id: string }>
}

export default function EditEntryPage({ params }: EditEntryPageProps): React.JSX.Element {
  const { session, isLoading: authLoading, handleSignOut } = useRoleBasedAuth({ requiredRole: 'CLIENT' })
  const router = useRouter()
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [entryId, setEntryId] = useState<string | null>(null)

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

  useEffect(() => {
    if (entryId) {
      fetchEntry()
    }
  }, [entryId, fetchEntry])

  const handleSubmit = async (data: CreateEntryInput): Promise<void> => {
    if (!entryId) return

    setIsSubmitting(true)
    setError('')

    try {
      await entriesService.updateEntry(entryId, data)
      // Redirect to the entry view page
      router.push(`/client/entries/${entryId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (error && !entry) {
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
        isLoading={authLoading || isLoading}
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

  return (
    <EntryDetailLayout
      session={session}
      isLoading={authLoading || isLoading}
      onSignOut={handleSignOut}
      backUrl={`/client/entries/${entry.id}`}
      backText="Back to Entry"
      title={`Edit: ${entry.title}`}
      description="Make changes to your journal entry"
    >
      <Card className='shadow-lg border-0 bg-white/90 backdrop-blur-sm'>
        <CardContent className='p-8'>
          {error && (
            <Alert variant="destructive" className='mb-6'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                <div>
                  <div className='font-semibold mb-1'>
                    Error updating entry
                  </div>
                  <div className='text-sm'>
                    {error}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className='mb-6 text-center'>
            <div className='mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4 shadow-lg'>
              <Edit className='w-6 h-6 text-white' />
            </div>
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>Edit Journal Entry</h2>
            <p className='text-gray-600'>Update your thoughts, feelings, and experiences</p>
          </div>

          <JournalEntryForm
            onSubmit={handleSubmit}
            initialData={{
              title: entry.title,
              content: entry.content as object || undefined,
              mood: entry.mood || undefined,
              tags: entry.tags || [],
              status: entry.status
            }}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </EntryDetailLayout>
  )
}