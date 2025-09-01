'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { JournalEntryForm } from '@/components/forms/JournalEntryForm'
import type { CreateEntryInput } from '@/types/database'
import { getFullName } from '@/lib/utils'

export default function NewEntryPage(): React.JSX.Element {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

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

  const handleSubmit = async (data: CreateEntryInput): Promise<void> => {
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create entry')
      }

      // Redirect to the entries list
      router.push('/client/entries')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
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
                New Journal Entry
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
          {error && (
            <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-md'>
              <div className='flex'>
                <div className='ml-3'>
                  <h3 className='text-sm font-medium text-red-800'>
                    Error creating entry
                  </h3>
                  <div className='mt-1 text-sm text-red-700'>
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          <JournalEntryForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </main>
    </div>
  )
}