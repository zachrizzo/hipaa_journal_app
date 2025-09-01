'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getFullName } from '@/lib/utils'

interface SharedEntry {
  id: string
  entryId: string
  entryTitle: string
  providerId: string
  clientId: string
  clientName: string | null
  scope: string
  message: string | null
  expiresAt: string | null
  isRevoked: boolean
  createdAt: string
  updatedAt: string
}

export default function SharedEntriesPage(): React.JSX.Element {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [shares, setShares] = useState<SharedEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'PROVIDER') {
      router.push('/login')
      return
    }
  }, [session, status, router])

  const fetchSharedEntries = async (): Promise<void> => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/shares?type=provided')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch shared entries')
      }

      setShares(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.role === 'PROVIDER') {
      fetchSharedEntries()
    }
  }, [session])

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getScopeColor = (scope: string): string => {
    switch (scope) {
      case 'FULL_ACCESS':
        return 'bg-green-100 text-green-800'
      case 'SUMMARY_ONLY':
        return 'bg-yellow-100 text-yellow-800'
      case 'TITLE_ONLY':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getScopeLabel = (scope: string): string => {
    switch (scope) {
      case 'FULL_ACCESS':
        return 'Full Access'
      case 'SUMMARY_ONLY':
        return 'Summary Only'
      case 'TITLE_ONLY':
        return 'Title Only'
      default:
        return 'No Access'
    }
  }

  if (status === 'loading') {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  if (!session) {
    return <></>
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <nav className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <div className='flex items-center space-x-4'>
              <Link 
                href='/provider'
                className='text-blue-600 hover:text-blue-800 font-medium'
              >
                ← Back to Dashboard
              </Link>
              <h1 className='text-xl font-semibold text-gray-900'>
                Shared Journal Entries
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

      <main className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
        {/* Error Message */}
        {error && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-md'>
            <p className='text-red-700'>{error}</p>
          </div>
        )}

        {/* Entries List */}
        {isLoading ? (
          <div className='flex justify-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          </div>
        ) : shares.length === 0 ? (
          <div className='bg-white rounded-lg shadow-sm p-12 text-center'>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>No entries shared with you</h3>
            <p className='text-gray-600 mb-4'>When patients share their journal entries with you, they will appear here.</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {shares.map(share => (
              <div key={share.id} className='bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow'>
                <div className='flex justify-between items-start mb-3'>
                  <div className='flex-1'>
                    <div className='flex items-center space-x-2 mb-2'>
                      <h3 className='text-lg font-semibold text-gray-900'>
                        {share.entryTitle}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getScopeColor(share.scope)}`}>
                        {getScopeLabel(share.scope)}
                      </span>
                    </div>
                    <div className='flex items-center space-x-4 text-sm text-gray-600'>
                      <span>👤 Patient: {share.clientName || 'Unknown'}</span>
                      <span>🕒 Shared: {formatDate(share.createdAt)}</span>
                      {share.expiresAt && (
                        <span>⏰ Expires: {formatDate(share.expiresAt)}</span>
                      )}
                    </div>
                  </div>
                  <div className='flex space-x-2'>
                    <Link
                      href={`/provider/shared-entries/${share.id}`}
                      className='text-blue-600 hover:text-blue-800 font-medium'
                    >
                      View Entry
                    </Link>
                  </div>
                </div>
                
                {share.message && (
                  <div className='mt-3 p-3 bg-gray-50 rounded-md'>
                    <h4 className='text-sm font-medium text-gray-700 mb-1'>Message from Patient</h4>
                    <p className='text-sm text-gray-600'>{share.message}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}