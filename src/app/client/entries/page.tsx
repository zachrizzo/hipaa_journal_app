'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Tables } from '@/types'
import { getFullName } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

type JournalEntry = Tables<'journal_entries'>

// API response interface using database types
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
    if (session) {
      fetchEntries(currentPage, searchQuery, statusFilter)
    }
  }, [currentPage, searchQuery, statusFilter, session])

  if (status === 'loading') {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Skeleton className='h-32 w-32 rounded-full' />
      </div>
    )
  }

  if (!session) {
    router.push('/login')
    return <></>
  }

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault()
    setCurrentPage(1)
    fetchEntries(1, searchQuery, statusFilter)
  }

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }


  const getMoodEmoji = (mood?: number): string => {
    if (!mood) return '😐'
    const moodEmojis = ['😢', '😞', '😐', '😕', '😔', '😐', '🙂', '😊', '😄', '😁']
    return moodEmojis[mood - 1] || '😐'
  }

  return (
    <div className='min-h-screen bg-background'>
      <nav className='bg-card shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <div className='flex items-center space-x-4'>
              <Button variant="ghost" asChild>
                <Link href='/client'>
                  ← Back to Dashboard
                </Link>
              </Button>
              <h1 className='text-xl font-semibold'>
                Journal Entries
              </h1>
            </div>
            <div className='flex items-center space-x-4'>
              <Button asChild>
                <Link href='/client/entries/new'>
                  New Entry
                </Link>
              </Button>
              <span className='text-sm text-muted-foreground'>
                {getFullName(session.user.firstName, session.user.lastName)}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
        {/* Search and Filters */}
        <Card className='mb-6'>
          <CardContent className='p-4'>
            <form onSubmit={handleSearch} className='flex gap-4 items-end'>
              <div className='flex-1 space-y-2'>
                <Label>Search entries</Label>
                <Input
                  type='text'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder='Search by title or tags...'
                />
              </div>
              <div className='space-y-2'>
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={(value: typeof statusFilter) => setStatusFilter(value)}>
                  <SelectTrigger className='w-32'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All</SelectItem>
                    <SelectItem value='DRAFT'>Draft</SelectItem>
                    <SelectItem value='PUBLISHED'>Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type='submit'>Search</Button>
            </form>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className='mb-6'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Entries List */}
        {isLoading ? (
          <div className='flex justify-center py-12'>
            <Skeleton className='h-8 w-8 rounded-full' />
          </div>
        ) : entries.length === 0 ? (
          <Card className='p-12 text-center'>
            <CardHeader>
              <CardTitle className='mb-2'>No entries found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground mb-4'>Start writing your first journal entry!</p>
              <Button asChild>
                <Link href='/client/entries/new'>Create Entry</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className='space-y-4'>
            {entries.map(entry => (
              <Card key={entry.id} className='hover:shadow-md transition-shadow'>
                <CardContent className='p-6'>
                  <div className='flex justify-between items-start mb-3'>
                    <div className='flex-1'>
                      <div className='flex items-center space-x-2 mb-2'>
                        <h3 className='text-lg font-semibold'>
                          {entry.title}
                        </h3>
                        <Badge variant={entry.status === 'PUBLISHED' ? 'default' : entry.status === 'DRAFT' ? 'secondary' : 'outline'}>
                          {entry.status.toLowerCase()}
                        </Badge>
                      </div>
                      <div className='flex items-center space-x-4 text-sm text-muted-foreground'>
                        <span>📝 {entry.wordCount} words</span>
                        {entry.mood && (
                          <span>{getMoodEmoji(entry.mood)} Mood: {entry.mood}/10</span>
                        )}
                        <span>🕒 {formatDate(entry.updatedAt)}</span>
                      </div>
                    </div>
                    <div className='flex space-x-2'>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/client/entries/${entry.id}/edit`}>
                          Edit
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/client/entries/${entry.id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                  
                  {entry.tags && entry.tags.length > 0 && (
                    <div className='flex flex-wrap gap-1 mb-3'>
                      {entry.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className='text-xs'>
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {entry.aiSummary && (
                    <div className='mt-3 p-3 bg-muted rounded-md'>
                      <h4 className='text-sm font-medium mb-1'>AI Summary</h4>
                      <p className='text-sm text-muted-foreground'>{entry.aiSummary}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='mt-8 flex justify-center items-center space-x-2'>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Badge variant="default" className='px-3 py-2'>
              {currentPage} of {totalPages}
            </Badge>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}