'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Text } from '@/components/ui/text'
import { EntryDetailLayout } from '@/components/entries/EntryDetailLayout'
import { useRoleBasedAuth } from '@/hooks/useRoleBasedAuth'
import { useRouter } from 'next/navigation'
import { entriesService, sharingService } from '@/services'
import { Share, CheckCircle, AlertCircle } from 'lucide-react'
import type { JournalEntry } from '@/types/database'
import type { ProviderListResponse } from '@/types/api'

interface ShareEntryPageProps {
  params: Promise<{ id: string }>
}

// Helper function to format provider display name
const formatProviderName = (provider: ProviderListResponse): string => {
  if (provider.firstName || provider.lastName) {
    return `${provider.firstName || ''} ${provider.lastName || ''}`.trim()
  }
  return provider.email
}

export default function ShareEntryPage({ params }: ShareEntryPageProps): React.JSX.Element {
  const { session, isLoading: authLoading, handleSignOut } = useRoleBasedAuth({ requiredRole: 'CLIENT' })
  const router = useRouter()
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [providers, setProviders] = useState<ProviderListResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [entryId, setEntryId] = useState<string | null>(null)

  // Form state
  const [selectedProviderId, setSelectedProviderId] = useState('')
  const [message, setMessage] = useState('')
  // Always share with full access (handled on submit)

  useEffect(() => {
    params.then(resolvedParams => {
      setEntryId(resolvedParams.id)
    })
  }, [params])


  const fetchEntry = useCallback(async (): Promise<void> => {
    if (!entryId) return
    
    try {
      const entry = await entriesService.getEntryById(entryId)
      if (!entry) {
        throw new Error('Entry not found')
      }
      setEntry(entry)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    }
  }, [entryId])

  const fetchProviders = useCallback(async (): Promise<void> => {
    try {
      const providers = await sharingService.getProviders()
      setProviders(providers as ProviderListResponse[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    }
  }, [])

  useEffect(() => {
    if (entryId) {
      Promise.all([fetchEntry(), fetchProviders()]).finally(() => setIsLoading(false))
    }
  }, [entryId, fetchEntry, fetchProviders])

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await sharingService.createShare({
        entryId: entryId!,
        providerId: selectedProviderId,
        scope: 'FULL_ACCESS',
        message: message || undefined
      })

      setSuccess('Entry shared successfully!')
      setTimeout(() => {
        router.push(`/client/entries/${entryId}`)
      }, 1000)
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
      title={`Share: ${entry.title}`}
      description="Share this complete journal entry with your healthcare provider"
    >
      <Card className='shadow-lg border-0 bg-white/90 backdrop-blur-sm'>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share className="w-5 h-5" />
            Share Journal Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert variant="success" className="mb-6">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <Text variant="success">{success}</Text>
              </AlertDescription>
            </Alert>
          )}

          <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <Text size="sm" variant="primary">
              <strong>What will be shared:</strong> Your healthcare provider will receive access to the complete journal entry including all content, mood, tags, and metadata.
            </Text>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className="space-y-2">
              <Label htmlFor="provider">Share with Provider</Label>
              <Select value={selectedProviderId} onValueChange={setSelectedProviderId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a healthcare provider..." />
                </SelectTrigger>
                <SelectContent>
                  {providers.map(provider => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {formatProviderName(provider)} ({provider.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            <div className="space-y-2">
              <Label htmlFor="message">Message to Provider (Optional)</Label>
              <Textarea
                id="message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder='Add a note for your healthcare provider...'
              />
              <Text size="xs" variant="muted">{message.length}/500 characters</Text>
            </div>

            <div className='flex justify-end space-x-3'>
              <Button variant="outline" type="button" asChild>
                <a href={`/client/entries/${entry.id}`}>Cancel</a>
              </Button>
              <Button 
                type='submit'
                disabled={isSubmitting || !selectedProviderId}
                className='min-w-[120px]'
              >
                {isSubmitting ? 'Sharing...' : 'Share Entry'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </EntryDetailLayout>
  )
}