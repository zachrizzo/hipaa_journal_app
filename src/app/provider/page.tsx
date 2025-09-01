'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect } from 'react'
import { getFullName } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { Heading } from '@/components/ui/heading'
import { Stethoscope, Share, FileText, MessageCircle, LogOut, Heart } from 'lucide-react'

export default function ProviderDashboard(): React.JSX.Element {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'PROVIDER') {
      // Redirect to appropriate dashboard based on role
      switch (session.user.role) {
        case 'ADMIN':
          router.push('/admin')
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
    <div className='min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-blue-50'>
      {/* Background Pattern */}
      <div className='absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] opacity-20' />
      
      <nav className='relative z-10 bg-white/85 backdrop-blur-sm shadow-sm border-b border-white/20'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
            <div className='flex items-center space-x-3'>
              <div className='w-10 h-10 bg-gradient-to-r from-green-600 to-teal-600 rounded-full flex items-center justify-center'>
                <Stethoscope className='w-5 h-5 text-white' />
              </div>
              <Heading as='h1' size='lg'>
                Provider Dashboard
              </Heading>
            </div>
            <div className='flex items-center space-x-4'>
              <Text size='sm' variant='muted'>
                Welcome, {getFullName(session.user.firstName, session.user.lastName)}
              </Text>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className='w-4 h-4 mr-2' />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className='relative z-10 max-w-7xl mx-auto py-12 sm:px-6 lg:px-8'>
        <div className='px-4 sm:px-0'>
          {/* Hero Section */}
          <div className='text-center mb-12'>
            <div className='mx-auto w-20 h-20 bg-gradient-to-r from-green-600 to-teal-600 rounded-full flex items-center justify-center mb-6 shadow-2xl'>
              <Heart className='w-10 h-10 text-white' />
            </div>
            <Heading as='h1' size='3xl' variant='gradient' className='mb-4'>
              Healthcare Provider Portal
            </Heading>
            <Text size='lg' variant='muted' className='max-w-2xl mx-auto'>
              Manage your patients&apos; journal entries, provide secure healthcare documentation, and maintain HIPAA-compliant patient care.
            </Text>
          </div>

          {/* Provider Tools Grid */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-12'>
            <Card className='shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]'>
              <CardContent className='p-8 text-center'>
                <div className='mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4'>
                  <Share className='w-8 h-8 text-white' />
                </div>
                <CardTitle className='mb-3'>Shared Entries</CardTitle>
                <Text variant='muted' className='mb-6'>
                  Access and review journal entries that patients have shared with you for medical review and care coordination.
                </Text>
                <Button variant='outline' size='lg' className='w-full border-green-200 text-green-700 hover:bg-green-50' asChild>
                  <Link href='/provider/shared-entries'>
                    <Share className='w-4 h-4 mr-2' />
                    View Shared Entries
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className='shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]'>
              <CardContent className='p-8 text-center'>
                <div className='mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-4'>
                  <FileText className='w-8 h-8 text-white' />
                </div>
                <CardTitle className='mb-3'>Create Report</CardTitle>
                <Text variant='muted' className='mb-6'>
                  Generate comprehensive medical reports and documentation based on patient journal data and observations.
                </Text>
                <Button variant='gradient' size='lg' className='w-full'>
                  <FileText className='w-4 h-4 mr-2' />
                  Create Report
                </Button>
              </CardContent>
            </Card>

            <Card className='shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]'>
              <CardContent className='p-8 text-center'>
                <div className='mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4'>
                  <MessageCircle className='w-8 h-8 text-white' />
                </div>
                <CardTitle className='mb-3'>Secure Messaging</CardTitle>
                <Text variant='muted' className='mb-6'>
                  Communicate securely with patients through encrypted messaging while maintaining HIPAA compliance.
                </Text>
                <Button variant='outline' size='lg' className='w-full border-purple-200 text-purple-700 hover:bg-purple-50'>
                  <MessageCircle className='w-4 h-4 mr-2' />
                  Secure Messaging
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Status Banner */}
          <Card className='shadow-lg border-0 bg-gradient-to-r from-green-600/10 to-teal-600/10 backdrop-blur-sm'>
            <CardContent className='p-6 text-center'>
              <div className='flex items-center justify-center space-x-2 mb-2'>
                <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                <Text size='sm' weight='medium'>Role: Healthcare Provider | Session Status: Active</Text>
              </div>
              <Text size='sm' variant='muted'>
                🏥 HIPAA Compliant | 🔒 All activities are logged and encrypted | 👩‍⚕️ Professional care standards
              </Text>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}