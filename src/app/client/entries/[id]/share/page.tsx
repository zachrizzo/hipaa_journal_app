'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Tables } from '@/types/database'
import { getFullName } from '@/lib/utils'

type JournalEntry = Tables<'journal_entries'>

interface ShareEntryPageProps {
  params: Promise<{ id: string }>
}

interface Provider {
  id: string
  name: string | null
  email: string
  role: string
}

export default function ShareEntryPage({ params }: ShareEntryPageProps): React.JSX.Element {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [entryId, setEntryId] = useState<string | null>(null)

  // Form state
  const [selectedProviderId, setSelectedProviderId] = useState('')
  const [scope, setScope] = useState<'TITLE_ONLY' | 'SUMMARY_ONLY' | 'FULL_ACCESS'>('FULL_ACCESS')
  const [message, setMessage] = useState('')

  useEffect(() => {
    params.then(resolvedParams => {
      setEntryId(resolvedParams.id)
    })
  }, [params])

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }
  }, [session, status, router])

  const fetchEntry = async (): Promise<void> => {
    if (!entryId) return
    
    try {
      const response = await fetch(`/api/entries/${entryId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch entry')
      }

      setEntry(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    }
  }

  const fetchProviders = async (): Promise<void> => {
    try {
      const response = await fetch('/api/providers')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch providers')
      }

      setProviders(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    }
  }

  useEffect(() => {
    if (entryId) {
      Promise.all([fetchEntry(), fetchProviders()]).finally(() => setIsLoading(false))
    }
  }, [entryId])

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/shares', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entryId: entryId,
          providerId: selectedProviderId,
          scope,
          message: message || undefined
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to share entry')
      }

      setSuccess('Entry shared successfully!')
      setTimeout(() => {
        router.push(`/client/entries/${entryId}`)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  if (!session) {
    return <></>
  }

  if (error && !entry) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='bg-white rounded-lg shadow-sm p-8 text-center'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>Error Loading Entry</h2>
          <p className='text-red-600 mb-6'>{error}</p>
          <Link
            href='/client/entries'
            className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium'
          >
            Back to Entries
          </Link>
        </div>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='bg-white rounded-lg shadow-sm p-8 text-center'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>Entry Not Found</h2>
          <p className='text-gray-600 mb-6'>The journal entry you&apos;re looking for could not be found.</p>
          <Link
            href='/client/entries'
            className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium'
          >
            Back to Entries
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <nav className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <div className='flex items-center space-x-4'>
              <Link 
                href={`/client/entries/${entry.id}`}
                className='text-blue-600 hover:text-blue-800 font-medium'
              >
                ← Back to Entry
              </Link>
              <h1 className='text-xl font-semibold text-gray-900'>
                Share Entry: {entry.title}
              </h1>
            </div>
            <div className='flex items-center space-x-4'>
              <span className='text-sm text-gray-700'>
                {getFullName(session.user.firstName, session.user.lastName)}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className='max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <h2 className='text-lg font-semibold text-gray-900 mb-6'>Share Journal Entry</h2>
          
          {error && (
            <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-md'>
              <p className='text-red-700'>{error}</p>
            </div>
          )}

          {success && (
            <div className='mb-6 p-4 bg-green-50 border border-green-200 rounded-md'>
              <p className='text-green-700'>{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Share with Provider
              </label>
              <select
                value={selectedProviderId}
                onChange={e => setSelectedProviderId(e.target.value)}
                required
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value=''>Select a healthcare provider...</option>
                {providers.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name || provider.email} ({provider.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Access Level
              </label>
              <div className='space-y-2'>
                <label className='flex items-center'>
                  <input
                    type='radio'
                    name='scope'
                    value='FULL_ACCESS'
                    checked={scope === 'FULL_ACCESS'}
                    onChange={e => setScope(e.target.value as 'FULL_ACCESS')}
                    className='mr-2'
                  />
                  <span className='text-sm'>
                    <strong>Full Access</strong> - Provider can see the complete entry including content, mood, and tags
                  </span>
                </label>
                <label className='flex items-center'>
                  <input
                    type='radio'
                    name='scope'
                    value='SUMMARY_ONLY'
                    checked={scope === 'SUMMARY_ONLY'}
                    onChange={e => setScope(e.target.value as 'SUMMARY_ONLY')}
                    className='mr-2'
                  />
                  <span className='text-sm'>
                    <strong>Summary Only</strong> - Provider can see title, AI summary, mood, and tags (no full content)
                  </span>
                </label>
                <label className='flex items-center'>
                  <input
                    type='radio'
                    name='scope'
                    value='TITLE_ONLY'
                    checked={scope === 'TITLE_ONLY'}
                    onChange={e => setScope(e.target.value as 'TITLE_ONLY')}
                    className='mr-2'
                  />
                  <span className='text-sm'>
                    <strong>Title Only</strong> - Provider can only see the entry title and basic metadata
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Message to Provider (Optional)
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder='Add a note for your healthcare provider...'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
              <p className='text-xs text-gray-500 mt-1'>{message.length}/500 characters</p>
            </div>

            <div className='flex justify-end space-x-4'>
              <Link
                href={`/client/entries/${entry.id}`}
                className='px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50'
              >
                Cancel
              </Link>
              <button
                type='submit'
                disabled={isSubmitting || !selectedProviderId}
                className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isSubmitting ? 'Sharing...' : 'Share Entry'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}