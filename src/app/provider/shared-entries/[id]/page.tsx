'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getFullName } from '@/lib/utils'

interface ViewSharedEntryPageProps {
  params: Promise<{ id: string }>
}

interface SharedEntryData {
  id: string
  entryId: string
  providerId: string
  clientId: string
  scope: string
  message: string | null
  expiresAt: string | null
  isRevoked: boolean
  createdAt: string
  updatedAt: string
  entry: {
    id: string
    title?: string
    content?: any
    contentHtml?: string
    status: string
    mood?: number | null
    tags?: string[]
    aiSummary?: string | null
    aiSummaryAt?: string | null
    createdAt: string
    updatedAt: string
    wordCount: number
  }
}

export default function ViewSharedEntryPage({ params }: ViewSharedEntryPageProps): React.JSX.Element {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [shareData, setShareData] = useState<SharedEntryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [shareId, setShareId] = useState<string | null>(null)

  useEffect(() => {
    params.then(resolvedParams => {
      setShareId(resolvedParams.id)
    })
  }, [params])

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

  const fetchSharedEntry = async (): Promise<void> => {
    if (!shareId) return
    
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/shares/${shareId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch shared entry')
      }

      setShareData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (shareId && session?.user?.role === 'PROVIDER') {
      fetchSharedEntry()
    }
  }, [shareId, session])

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  const getMoodEmoji = (mood?: number | null): string => {
    if (!mood) return '😐'
    const moodEmojis = ['😢', '😞', '😐', '😕', '😔', '😐', '🙂', '😊', '😄', '😁']
    return moodEmojis[mood - 1] || '😐'
  }

  const getMoodLabel = (mood?: number | null): string => {
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

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='bg-white rounded-lg shadow-sm p-8 text-center'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>Error Loading Shared Entry</h2>
          <p className='text-red-600 mb-6'>{error}</p>
          <Link
            href='/provider/shared-entries'
            className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium'
          >
            Back to Shared Entries
          </Link>
        </div>
      </div>
    )
  }

  if (!shareData) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='bg-white rounded-lg shadow-sm p-8 text-center'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>Shared Entry Not Found</h2>
          <p className='text-gray-600 mb-6'>The shared journal entry you're looking for could not be found.</p>
          <Link
            href='/provider/shared-entries'
            className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium'
          >
            Back to Shared Entries
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
                href='/provider/shared-entries'
                className='text-blue-600 hover:text-blue-800 font-medium'
              >
                ← Back to Shared Entries
              </Link>
              <h1 className='text-xl font-semibold text-gray-900'>
                Shared Entry
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
        <div className='bg-white rounded-lg shadow-sm'>
          {/* Share Information Header */}
          <div className='px-6 py-4 border-b border-gray-200 bg-blue-50'>
            <div className='flex justify-between items-center'>
              <div>
                <h2 className='text-lg font-semibold text-gray-900'>Shared by Patient</h2>
                <p className='text-sm text-gray-600'>Access Level: <span className={`px-2 py-1 text-xs font-medium rounded-full ${getScopeColor(shareData.scope)}`}>
                  {getScopeLabel(shareData.scope)}
                </span></p>
              </div>
              <div className='text-right text-sm text-gray-600'>
                <p>Shared: {formatDate(shareData.createdAt)}</p>
                {shareData.expiresAt && (
                  <p>Expires: {formatDate(shareData.expiresAt)}</p>
                )}
              </div>
            </div>
            {shareData.message && (
              <div className='mt-4 p-3 bg-white rounded-md'>
                <h3 className='text-sm font-medium text-gray-700 mb-1'>Patient Message</h3>
                <p className='text-sm text-gray-600'>{shareData.message}</p>
              </div>
            )}
          </div>

          {/* Entry Header */}
          <div className='px-6 py-4 border-b border-gray-200'>
            <div className='flex justify-between items-start'>
              <div className='flex-1'>
                {shareData.entry.title && (
                  <h1 className='text-2xl font-bold text-gray-900 mb-2'>
                    {shareData.entry.title}
                  </h1>
                )}
                <div className='flex items-center space-x-4 text-sm text-gray-600'>
                  <span>📝 {shareData.entry.wordCount} words</span>
                  <span>🕒 {formatDate(shareData.entry.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Entry Content */}
          {shareData.scope === 'FULL_ACCESS' && shareData.entry.content && (
            <div className='px-6 py-6'>
              <div className='prose max-w-none'>
                <div className='whitespace-pre-wrap text-gray-700 leading-relaxed'>
                  {renderContent(shareData.entry.content)}
                </div>
              </div>
            </div>
          )}

          {/* AI Summary */}
          {(shareData.scope === 'FULL_ACCESS' || shareData.scope === 'SUMMARY_ONLY') && shareData.entry.aiSummary && (
            <div className='px-6 py-4 bg-blue-50 border-t border-gray-200'>
              <h3 className='text-sm font-medium text-gray-700 mb-2'>AI Summary</h3>
              <p className='text-sm text-gray-600'>{shareData.entry.aiSummary}</p>
              {shareData.entry.aiSummaryAt && (
                <p className='text-xs text-gray-500 mt-1'>
                  Generated: {formatDate(shareData.entry.aiSummaryAt)}
                </p>
              )}
            </div>
          )}

          {/* Metadata */}
          {(shareData.scope === 'FULL_ACCESS' || shareData.scope === 'SUMMARY_ONLY') && (
            <div className='px-6 py-4 bg-gray-50 border-t border-gray-200'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Mood */}
                {shareData.entry.mood && (
                  <div>
                    <h3 className='text-sm font-medium text-gray-700 mb-2'>Mood</h3>
                    <div className='flex items-center space-x-2'>
                      <span className='text-2xl'>{getMoodEmoji(shareData.entry.mood)}</span>
                      <span className='text-sm text-gray-600'>
                        {shareData.entry.mood}/10 - {getMoodLabel(shareData.entry.mood)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {shareData.entry.tags && shareData.entry.tags.length > 0 && (
                  <div>
                    <h3 className='text-sm font-medium text-gray-700 mb-2'>Tags</h3>
                    <div className='flex flex-wrap gap-1'>
                      {shareData.entry.tags.map(tag => (
                        <span key={tag} className='px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full'>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {shareData.scope === 'TITLE_ONLY' && (
            <div className='px-6 py-8 text-center text-gray-500'>
              <p>This entry was shared with "Title Only" access. Contact the patient for additional details if needed.</p>
            </div>
          )}

          {/* Timestamps */}
          <div className='px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500'>
            <div className='flex justify-between'>
              <span>Entry Created: {formatDate(shareData.entry.createdAt)}</span>
              <span>Entry Last Modified: {formatDate(shareData.entry.updatedAt)}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}