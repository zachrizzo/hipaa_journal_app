'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

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
      case 'ADMIN':
        router.push('/admin')
        break
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
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='text-center'>
        <h1 className='text-2xl font-bold text-gray-900 mb-4'>HIPAA Journal</h1>
        <p className='text-gray-600'>Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}
