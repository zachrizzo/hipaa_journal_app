'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { getFullName } from '@/lib/utils'

export default function AdminDashboard(): React.JSX.Element {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'ADMIN') {
      // Redirect to appropriate dashboard based on role
      switch (session.user.role) {
        case 'PROVIDER':
          router.push('/provider')
          break
        case 'CLIENT':
          router.push('/client')
          break
        default:
          break
      }
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const handleSignOut = async (): Promise<void> => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <nav className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
            <div className='flex items-center'>
              <h1 className='text-xl font-semibold text-gray-900'>
                HIPAA Journal - Admin Dashboard
              </h1>
            </div>
            <div className='flex items-center space-x-4'>
              <span className='text-sm text-gray-700'>
                Welcome, {getFullName(session.user.firstName, session.user.lastName)}
              </span>
              <button
                onClick={handleSignOut}
                className='bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium'
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          <div className='border-4 border-dashed border-gray-200 rounded-lg p-8'>
            <div className='text-center'>
              <h2 className='text-2xl font-bold text-gray-900 mb-4'>
                System Administration
              </h2>
              <p className='text-gray-600 mb-8'>
                Manage the HIPAA Journal system, users, and compliance settings.
              </p>
              
              <div className='bg-white rounded-lg shadow p-6'>
                <h3 className='text-lg font-medium text-gray-900 mb-4'>
                  Admin Controls
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                  <button className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md'>
                    User Management
                  </button>
                  <button className='bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md'>
                    Audit Logs
                  </button>
                  <button className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md'>
                    System Settings
                  </button>
                  <button className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md'>
                    Compliance Reports
                  </button>
                </div>
              </div>

              <div className='mt-8 bg-red-50 border border-red-200 rounded-lg p-4'>
                <h4 className='text-red-800 font-medium mb-2'>Administrator Access</h4>
                <p className='text-red-700 text-sm'>
                  You have full system access. All administrative actions are logged and monitored.
                </p>
              </div>

              <div className='mt-8 text-sm text-gray-500'>
                <p>Role: System Administrator | Session Status: Active</p>
                <p>HIPAA Compliant | Maximum security clearance</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}