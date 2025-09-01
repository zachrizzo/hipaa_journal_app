'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getFullName } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { Heading } from '@/components/ui/heading'
import { FileText, PlusCircle, LogOut, Tag, Search, Filter, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Tables } from '@/types/database'

type JournalEntry = Tables<'journal_entries'>

export default function ClientDashboard(): React.JSX.Element {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'DRAFT' | 'PUBLISHED'>('all')

  const fetchEntries = async (): Promise<void> => {
    if (!session) return
    
    try {
      const response = await fetch('/api/entries?limit=6')
      const result = await response.json()
      
      if (response.ok && result.data?.entries) {
        setEntries(result.data.entries)
      }
    } catch (error) {
      console.error('Failed to fetch entries:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'CLIENT') {
      // Redirect to appropriate dashboard based on role
      switch (session.user.role) {
        case 'ADMIN':
          router.push('/admin')
          break
        case 'PROVIDER':
          router.push('/provider')
          break
        default:
          break
      }
    } else {
      fetchEntries()
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Skeleton className='h-32 w-32 rounded-full' />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">You must be logged in to access this page.</p>
        </div>
      </div>
    )
  }

  const handleSignOut = async (): Promise<void> => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'>
      {/* Background Pattern */}
      <div className='absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] opacity-20' />
      
      <nav className='relative z-10 bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <div className='flex items-center space-x-3'>
              <div className='w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center'>
                <FileText className='w-5 h-5 text-white' />
              </div>
              <Heading as='h1' size='lg'>
                HIPAA Journal
              </Heading>
            </div>
            <div className='flex items-center space-x-3'>
              <Button variant='gradient' size='sm' asChild>
                <Link href='/client/entries/new'>
                  <PlusCircle className='w-4 h-4 mr-2' />
                  New Entry
                </Link>
              </Button>
              <div className='hidden sm:block h-6 w-px bg-gray-300'></div>
              <Text size='sm' variant='muted' className='hidden sm:block'>
                {getFullName(session.user.firstName, session.user.lastName)}
              </Text>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className='w-4 h-4' />
                <span className='hidden sm:inline ml-2'>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className='relative z-10 max-w-7xl mx-auto py-12 sm:px-6 lg:px-8'>
        <div className='px-4 sm:px-0'>
          {/* Header Section */}
          <div className='flex items-center justify-between mb-8'>
            <div>
              <Heading as='h1' size='3xl' variant='gradient' className='mb-2'>
                Your Journal Entries
              </Heading>
              <Text size='lg' variant='muted'>
                Document your thoughts, experiences, and professional insights
              </Text>
            </div>
          </div>


          {/* Search and Filter Bar */}
          <Card className='shadow-lg border-0 bg-white/90 backdrop-blur-sm mb-8'>
            <CardContent className='p-6'>
              <div className='flex flex-col sm:flex-row gap-4 items-stretch sm:items-center'>
                <div className='flex-1'>
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                    <Input
                      placeholder='Search your entries...'
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className='pl-10 h-11'
                    />
                  </div>
                </div>
                <div className='flex items-center space-x-3 sm:flex-shrink-0'>
                  <Filter className='w-4 h-4 text-gray-500' />
                  <Select value={statusFilter} onValueChange={(value: 'all' | 'DRAFT' | 'PUBLISHED') => setStatusFilter(value)}>
                    <SelectTrigger className='w-36 h-11'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Status</SelectItem>
                      <SelectItem value='DRAFT'>Draft</SelectItem>
                      <SelectItem value='PUBLISHED'>Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Journal Entries Grid */}
          {isLoading ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className='shadow-lg border-0 bg-white/90 backdrop-blur-sm'>
                  <CardContent className='p-6'>
                    <Skeleton className='h-6 w-3/4 mb-3' />
                    <Skeleton className='h-4 w-full mb-2' />
                    <Skeleton className='h-4 w-2/3 mb-4' />
                    <div className='flex justify-between items-center'>
                      <Skeleton className='h-5 w-16' />
                      <Skeleton className='h-4 w-20' />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <Card className='shadow-xl border-0 bg-white/90 backdrop-blur-sm'>
              <CardContent className='p-12 text-center'>
                <div className='mx-auto w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-6 opacity-50'>
                  <FileText className='w-10 h-10 text-white' />
                </div>
                <Heading as='h3' size='xl' className='mb-3'>
                  No entries yet
                </Heading>
                <Text variant='muted' className='mb-6'>
                  Start your journaling journey by creating your first entry
                </Text>
                <Button variant='gradient' size='lg' asChild>
                  <Link href='/client/entries/new'>
                    <PlusCircle className='w-5 h-5 mr-2' />
                    Create Your First Entry
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {entries.map((entry) => (
                <Link key={entry.id} href={`/client/entries/${entry.id}`}>
                  <Card className='shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] cursor-pointer'>
                    <CardContent className='p-6'>
                      <div className='flex justify-between items-start mb-3'>
                        <Heading as='h3' size='lg' className='line-clamp-2'>
                          {entry.title || 'Untitled Entry'}
                        </Heading>
                        <Badge variant={entry.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                          {entry.status}
                        </Badge>
                      </div>
                      {entry.content && (
                        <Text variant='muted' className='line-clamp-3 mb-4'>
                          {JSON.stringify(entry.content).length > 150 ? `${JSON.stringify(entry.content).substring(0, 150)}...` : JSON.stringify(entry.content)}
                        </Text>
                      )}
                      <div className='flex items-center justify-between text-sm'>
                        <div className='flex items-center space-x-2'>
                          <Calendar className='w-4 h-4 text-gray-400' />
                          <Text size='sm' variant='muted'>
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </Text>
                        </div>
                        {entry.tags && entry.tags.length > 0 && (
                          <div className='flex items-center space-x-1'>
                            <Tag className='w-4 h-4 text-gray-400' />
                            <Text size='sm' variant='muted'>
                              {entry.tags.length} {entry.tags.length === 1 ? 'tag' : 'tags'}
                            </Text>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}