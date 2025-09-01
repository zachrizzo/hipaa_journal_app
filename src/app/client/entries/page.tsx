'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Tables } from '@/types/database'
import { getFullName } from '@/lib/utils'

type JournalEntry = Tables<'journal_entries'>

interface EntriesResponse {
  entries: JournalEntry[]
  total: number
  page: number
  totalPages: number
}

export default function EntriesPage(): React.JSX.Element {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'DRAFT' | 'PUBLISHED'>('all')

  if (status === 'loading') {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  if (!session) {
    router.push('/login')
    return <></>
  }

  const fetchEntries = async (page = 1, search = '', status = 'all'): Promise<void> => {
    setIsLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })

      if (search) {
        params.append('search', search)
      }

      if (status !== 'all') {
        params.append('status', status)
      }

      const response = await fetch(`/api/entries?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch entries')
      }

      const data = result.data as EntriesResponse
      setEntries(data.entries)
      setCurrentPage(data.page)
      setTotalPages(data.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries(currentPage, searchQuery, statusFilter)
  }, [currentPage, searchQuery, statusFilter])

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault()
    setCurrentPage(1)
    fetchEntries(1, searchQuery, statusFilter)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

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

  const getMoodEmoji = (mood?: number): string => {
    if (!mood) return '😐'
    const moodEmojis = ['😢', '😞', '😐', '😕', '😔', '😐', '🙂', '😊', '😄', '😁']
    return moodEmojis[mood - 1] || '😐'
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <nav className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <div className='flex items-center space-x-4'>
              <Link 
                href='/client'
                className='text-blue-600 hover:text-blue-800 font-medium'
              >
                ← Back to Dashboard
              </Link>
              <h1 className='text-xl font-semibold text-gray-900'>
                Journal Entries
              </h1>
            </div>
            <div className='flex items-center space-x-4'>
              <Link
                href='/client/entries/new'
                className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium'
              >
                New Entry
              </Link>
              <span className='text-sm text-gray-700'>
                {getFullName(session.user.firstName, session.user.lastName)}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
        {/* Search and Filters */}
        <div className='bg-white rounded-lg shadow-sm p-4 mb-6'>
          <form onSubmit={handleSearch} className='flex gap-4 items-end'>
            <div className='flex-1'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Search entries
              </label>
              <input
                type='text'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder='Search by title or tags...'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Status
              </label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='all'>All</option>
                <option value='DRAFT'>Draft</option>
                <option value='PUBLISHED'>Published</option>
              </select>
            </div>
            <button
              type='submit'
              className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
            >
              Search
            </button>
          </form>
        </div>

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
        ) : entries.length === 0 ? (
          <div className='bg-white rounded-lg shadow-sm p-12 text-center'>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>No entries found</h3>
            <p className='text-gray-600 mb-4'>Start writing your first journal entry!</p>
            <Link
              href='/client/entries/new'
              className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium inline-block'
            >
              Create Entry
            </Link>
          </div>
        ) : (
          <div className='space-y-4'>
            {entries.map(entry => (
              <div key={entry.id} className='bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow'>
                <div className='flex justify-between items-start mb-3'>
                  <div className='flex-1'>
                    <div className='flex items-center space-x-2 mb-2'>
                      <h3 className='text-lg font-semibold text-gray-900'>
                        {entry.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(entry.status)}`}>
                        {entry.status.toLowerCase()}
                      </span>
                    </div>
                    <div className='flex items-center space-x-4 text-sm text-gray-600'>
                      <span>📝 {entry.wordCount} words</span>
                      {entry.mood && (
                        <span>{getMoodEmoji(entry.mood)} Mood: {entry.mood}/10</span>
                      )}
                      <span>🕒 {formatDate(entry.updatedAt)}</span>
                    </div>
                  </div>
                  <div className='flex space-x-2'>
                    <Link
                      href={`/client/entries/${entry.id}/edit`}
                      className='text-blue-600 hover:text-blue-800 font-medium'
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/client/entries/${entry.id}`}
                      className='text-gray-600 hover:text-gray-800 font-medium'
                    >
                      View
                    </Link>
                  </div>
                </div>
                
                {entry.tags && entry.tags.length > 0 && (
                  <div className='flex flex-wrap gap-1 mb-3'>
                    {entry.tags.map(tag => (
                      <span key={tag} className='px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full'>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {entry.aiSummary && (
                  <div className='mt-3 p-3 bg-gray-50 rounded-md'>
                    <h4 className='text-sm font-medium text-gray-700 mb-1'>AI Summary</h4>
                    <p className='text-sm text-gray-600'>{entry.aiSummary}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='mt-8 flex justify-center space-x-2'>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className='px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Previous
            </button>
            <span className='px-3 py-2 bg-blue-600 text-white rounded-md'>
              {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className='px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  )
}