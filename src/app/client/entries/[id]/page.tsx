'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Tables } from '@/types/database'
import { getFullName } from '@/lib/utils'

type JournalEntry = Tables<'journal_entries'>

interface ViewEntryPageProps {
  params: Promise<{ id: string }>
}

export default function ViewEntryPage({ params }: ViewEntryPageProps): React.JSX.Element {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [entryId, setEntryId] = useState<string | null>(null)

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
    
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/entries/${entryId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch entry')
      }

      setEntry(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (entryId) {
      fetchEntry()
    }
  }, [entryId])

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

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  const getMoodLabel = (mood?: number): string => {
    if (!mood) return 'Not specified'
    const moodLabels = ['Terrible', 'Bad', 'Poor', 'Below Average', 'Average', 'Above Average', 'Good', 'Great', 'Excellent', 'Outstanding']
    return moodLabels[mood - 1] || 'Unknown'
  }

  const renderContent = (content: any): string => {
    if (typeof content === 'string') {
      return content
    }
    
    // Simple extraction of text from TipTap JSON
    try {
      if (content?.content) {
        return content.content
          .map((node: any) => {
            if (node.type === 'paragraph' && node.content) {
              return node.content.map((textNode: any) => textNode.text || '').join('')
            }
            return ''
          })
          .join('\n\n')
      }
      return JSON.stringify(content)
    } catch {
      return 'Content could not be displayed'
    }
  }

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  if (error) {
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
          <p className='text-gray-600 mb-6'>The journal entry you're looking for could not be found.</p>
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
                href='/client/entries'
                className='text-blue-600 hover:text-blue-800 font-medium'
              >
                ← Back to Entries
              </Link>
              <h1 className='text-xl font-semibold text-gray-900'>
                View Entry
              </h1>
            </div>
            <div className='flex items-center space-x-4'>
              <Link
                href={`/client/entries/${entry.id}/edit`}
                className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium'
              >
                Edit Entry
              </Link>
              <Link
                href={`/client/entries/${entry.id}/share`}
                className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium'
              >
                Share Entry
              </Link>
              <span className='text-sm text-gray-700'>
                {getFullName(session.user.firstName, session.user.lastName)}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className='max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
        <div className='bg-white rounded-lg shadow-sm'>
          {/* Header */}
          <div className='px-6 py-4 border-b border-gray-200'>
            <div className='flex justify-between items-start'>
              <div className='flex-1'>
                <h1 className='text-2xl font-bold text-gray-900 mb-2'>
                  {entry.title}
                </h1>
                <div className='flex items-center space-x-4 text-sm text-gray-600'>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(entry.status)}`}>
                    {entry.status.toLowerCase()}
                  </span>
                  <span>📝 {entry.wordCount} words</span>
                  <span>🕒 {formatDate(entry.updatedAt)}</span>
                  {entry.publishedAt && (
                    <span>📅 Published: {formatDate(entry.publishedAt)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className='px-6 py-6'>
            <div className='prose max-w-none'>
              <div className='whitespace-pre-wrap text-gray-700 leading-relaxed'>
                {renderContent(entry.content)}
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className='px-6 py-4 bg-gray-50 border-t border-gray-200'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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
                    {entry.tags.map(tag => (
                      <span key={tag} className='px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full'>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Summary */}
          {entry.aiSummary && (
            <div className='px-6 py-4 bg-blue-50 border-t border-gray-200'>
              <h3 className='text-sm font-medium text-gray-700 mb-2'>AI Summary</h3>
              <p className='text-sm text-gray-600'>{entry.aiSummary}</p>
              {entry.aiSummaryAt && (
                <p className='text-xs text-gray-500 mt-1'>
                  Generated: {formatDate(entry.aiSummaryAt)}
                </p>
              )}
            </div>
          )}

          {/* Timestamps */}
          <div className='px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500'>
            <div className='flex justify-between'>
              <span>Created: {formatDate(entry.createdAt)}</span>
              <span>Last modified: {formatDate(entry.updatedAt)}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}