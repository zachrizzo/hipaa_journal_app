'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { Heading } from '@/components/ui/heading'
import { Button } from '@/components/ui/button'
import { Calendar, Tag, PlusCircle, FileText } from 'lucide-react'
import type { JournalEntry } from '@/types/database'

interface EntryGridProps {
  entries: JournalEntry[]
  isLoading: boolean
  emptyStateConfig: {
    title: string
    description: string
    actionText: string
    actionHref: string
  }
  entryUrlGenerator: (entryId: string) => string
}

export function EntryGrid({ entries, isLoading, emptyStateConfig, entryUrlGenerator }: EntryGridProps) {
  if (isLoading) {
    return (
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
    )
  }

  if (entries.length === 0) {
    return (
      <div className='flex items-center justify-center py-16'>
        <Card className='shadow-xl border-0 bg-white/90 backdrop-blur-sm max-w-3xl w-full'>
          <CardContent className='px-8 py-14'>
            <div className='mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-6 opacity-60'>
              <FileText className='w-8 h-8 text-white' />
            </div>
            <div className='max-w-xl mx-auto text-center space-y-5'>
              <Heading as='h3' size='xl'>
                {emptyStateConfig.title}
              </Heading>
              <Text variant='muted'>
                {emptyStateConfig.description}
              </Text>
              <div className='pt-2'>
                <Button variant='gradient' size='lg' asChild>
                  <Link href={emptyStateConfig.actionHref}>
                    <PlusCircle className='w-5 h-5 mr-2' />
                    {emptyStateConfig.actionText}
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
      {entries.map((entry) => (
        <Link key={entry.id} href={entryUrlGenerator(entry.id)}>
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
                  {typeof entry.content === 'string' 
                    ? entry.content.length > 150 
                      ? `${entry.content.substring(0, 150)}...` 
                      : entry.content
                    : JSON.stringify(entry.content).length > 150
                      ? `${JSON.stringify(entry.content).substring(0, 150)}...`
                      : JSON.stringify(entry.content)
                  }
                </Text>
              )}
              <div className='flex items-center justify-between text-sm'>
                <div className='flex items-center space-x-2'>
                  <Calendar className='w-4 h-4 text-muted-foreground' />
                  <Text size='sm' variant='muted'>
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </Text>
                </div>
                {entry.tags && entry.tags.length > 0 && (
                  <div className='flex items-center space-x-1'>
                    <Tag className='w-4 h-4 text-muted-foreground' />
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
  )
}