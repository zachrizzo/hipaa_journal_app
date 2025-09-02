'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { JournalEntryForm } from '@/components/forms/JournalEntryForm'
import { EntryDetailLayout } from '@/components/entries/EntryDetailLayout'
import { useRoleBasedAuth } from '@/hooks/useRoleBasedAuth'
import { entriesService } from '@/services'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Text } from '@/components/ui/text'
import { Heading } from '@/components/ui/heading'
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
        isLoading={authLoading || isLoading}
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
                  <Text size="default" variant="default" className='font-semibold mb-1'>
                    Error updating entry
                  </Text>
                  <Text size="sm" variant="default">
                    {error}
                  </Text>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className='mb-6 text-center'>
            <div className='mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4 shadow-lg'>
              <Edit className='w-6 h-6 text-white' />
            </div>
            <Heading size="xl" variant="default" as="h2" className='mb-2'>Edit Journal Entry</Heading>
            <Text size="default" variant="muted">Update your thoughts, feelings, and experiences</Text>
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