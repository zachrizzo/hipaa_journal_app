'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AppHeader } from '@/components/layout/AppHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { Heading } from '@/components/ui/heading'
import { Shield, Users, FileSearch, Settings, BarChart, LogOut, AlertTriangle } from 'lucide-react'

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
        <Skeleton className='h-32 w-32 rounded-full' />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <Text variant="muted">You must be logged in to access this page.</Text>
        </div>
      </div>
    )
  }

  const handleSignOut = async (): Promise<void> => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50'>
      {/* Background Pattern */}
      <div className='absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] opacity-30' />
      
      <AppHeader
        title="Admin Dashboard"
        user={session.user}
        backgroundStyle="glass"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
          >
            <LogOut className='w-4 h-4 mr-2' />
            Sign Out
          </Button>
        }
      />

      <main className='relative z-10 max-w-7xl mx-auto py-12 sm:px-6 lg:px-8'>
        <div className='px-4 sm:px-0'>
          {/* Hero Section */}
          <div className='text-center mb-12'>
            <div className='mx-auto w-20 h-20 bg-gradient-to-r from-red-600 to-orange-600 rounded-full flex items-center justify-center mb-6 shadow-2xl'>
              <Shield className='w-10 h-10 text-white' />
            </div>
            <Heading as='h1' size='3xl' variant='gradient' className='mb-4'>
              System Administration
            </Heading>
            <Text size='lg' variant='muted' className='max-w-2xl mx-auto'>
              Manage the HIPAA Journal system, users, and compliance settings with complete administrative control.
            </Text>
          </div>

          {/* Admin Controls Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12'>
            <Card className='shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]'>
              <CardContent className='p-6 text-center'>
                <div className='mx-auto w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mb-4'>
                  <Users className='w-6 h-6 text-white' />
                </div>
                <CardTitle className='text-lg mb-2'>User Management</CardTitle>
                <Text size='sm' variant='muted' className='mb-4'>
                  Manage user accounts, roles, and permissions
                </Text>
                <Button variant='destructive' size='sm' className='w-full'>
                  <Users className='w-4 h-4 mr-2' />
                  Manage Users
                </Button>
              </CardContent>
            </Card>

            <Card className='shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]'>
              <CardContent className='p-6 text-center'>
                <div className='mx-auto w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mb-4'>
                  <FileSearch className='w-6 h-6 text-white' />
                </div>
                <CardTitle className='text-lg mb-2'>Audit Logs</CardTitle>
                <Text size='sm' variant='muted' className='mb-4'>
                  Review system activity and security events
                </Text>
                <Button variant='outline' size='sm' className='w-full'>
                  <FileSearch className='w-4 h-4 mr-2' />
                  View Logs
                </Button>
              </CardContent>
            </Card>

            <Card className='shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]'>
              <CardContent className='p-6 text-center'>
                <div className='mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-4'>
                  <Settings className='w-6 h-6 text-white' />
                </div>
                <CardTitle className='text-lg mb-2'>System Settings</CardTitle>
                <Text size='sm' variant='muted' className='mb-4'>
                  Configure system parameters and preferences
                </Text>
                <Button variant='outline' size='sm' className='w-full'>
                  <Settings className='w-4 h-4 mr-2' />
                  Settings
                </Button>
              </CardContent>
            </Card>

            <Card className='shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]'>
              <CardContent className='p-6 text-center'>
                <div className='mx-auto w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4'>
                  <BarChart className='w-6 h-6 text-white' />
                </div>
                <CardTitle className='text-lg mb-2'>Compliance Reports</CardTitle>
                <Text size='sm' variant='muted' className='mb-4'>
                  Generate HIPAA compliance and audit reports
                </Text>
                <Button variant='outline' size='sm' className='w-full'>
                  <BarChart className='w-4 h-4 mr-2' />
                  Reports
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Security Alert */}
          <Alert variant="destructive" className='mb-8 shadow-lg border-0 backdrop-blur-sm'>
            <AlertTriangle className='h-5 w-5' />
            <AlertDescription>
              <div>
                <Text weight='semibold' className='mb-1'>Administrator Access</Text>
                <Text size='sm'>
                  You have full system access. All administrative actions are logged and monitored for security and compliance purposes.
                </Text>
              </div>
            </AlertDescription>
          </Alert>

          {/* Status Footer */}
          <Card className='shadow-lg border-0 bg-gradient-to-r from-gray-600/10 to-slate-600/10 backdrop-blur-sm'>
            <CardContent className='p-6 text-center'>
              <div className='flex items-center justify-center space-x-2 mb-2'>
                <div className='w-2 h-2 bg-primary rounded-full animate-pulse'></div>
                <Text size='sm' weight='medium'>Role: System Administrator | Session Status: Active</Text>
              </div>
              <Text size='sm' variant='muted'>
                🛡️ HIPAA Compliant | 🔒 Maximum security clearance | 📊 All actions monitored
              </Text>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}