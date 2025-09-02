'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { JournalEntryForm } from '@/components/forms/JournalEntryForm'
import { AppHeader } from '@/components/layout/AppHeader'
import { entriesService } from '@/services'
import type { CreateEntryInput } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { Heading } from '@/components/ui/heading'
import { PlusCircle, AlertCircle } from 'lucide-react'

export default function NewEntryPage(): React.JSX.Element {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

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

  const handleSubmit = async (data: CreateEntryInput): Promise<void> => {
    setIsSubmitting(true)
    setError('')

    try {
      // Use the entries service instead of direct fetch
      await entriesService.createEntry(data)

      // Redirect to the client dashboard
      router.push('/client')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'>
      {/* Background Pattern */}
      <div className='absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] opacity-20' />
      
      <AppHeader
        title="New Journal Entry"
        backUrl="/client"
        backText="Back to Dashboard"
        user={session.user}
        backgroundStyle="glass"
      />

      <main className='relative z-10 max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-8'>
          <div className='mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mb-4 shadow-lg'>
            <PlusCircle className='w-8 h-8 text-white' />
          </div>
          <Heading as='h1' size='2xl' variant='gradient' className='mb-2'>
            Create New Entry
          </Heading>
          <Text variant='muted'>
            Express your thoughts, document your day, or reflect on your experiences
          </Text>
        </div>

        <Card className='shadow-2xl border-0 bg-white/95 backdrop-blur-sm'>
          <CardContent className='p-8'>
            {error && (
              <Alert variant="destructive" className='mb-6'>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>
                  <div>
                    <Text weight='semibold' className='mb-1'>
                      Error creating entry
                    </Text>
                    <Text size='sm'>
                      {error}
                    </Text>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <JournalEntryForm
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}