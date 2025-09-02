'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Text } from '@/components/ui/text'
import { Heading } from '@/components/ui/heading'

export default function HomePage(): React.JSX.Element {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    // Redirect based on user role
    switch (session.user.role) {
      case 'PROVIDER':
        router.push('/provider')
        break
      case 'CLIENT':
      default:
        router.push('/client')
        break
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-primary' />
      </div>
    )
  }

  return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='text-center'>
        <Heading size='xl' className='mb-4'>HIPAA Journal</Heading>
        <Text variant='muted'>Redirecting to your dashboard...</Text>
      </div>
    </div>
  )
}
