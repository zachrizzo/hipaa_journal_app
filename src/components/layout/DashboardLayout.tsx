'use client'

import { ReactNode } from 'react'
import { getFullName } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { Heading } from '@/components/ui/heading'
import { LogOut, LucideIcon } from 'lucide-react'
import type { Session } from 'next-auth'

interface DashboardLayoutProps {
  session: Session | null
  isLoading: boolean
  onSignOut: () => void
  title: string
  gradientFrom: string
  gradientTo: string
  icon: LucideIcon
  children: ReactNode
  headerActions?: ReactNode
}

export function DashboardLayout({
  session,
  isLoading,
  onSignOut,
  title,
  gradientFrom,
  gradientTo,
  icon: Icon,
  children,
  headerActions
}: DashboardLayoutProps) {
  if (isLoading) {
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

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradientFrom} ${gradientTo}`}>
      {/* Background Pattern */}
      <div className='absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] opacity-20' />
      
      <nav className='relative z-10 bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <div className='flex items-center space-x-3'>
              <div className={`w-10 h-10 bg-gradient-to-r ${gradientFrom} ${gradientTo} rounded-full flex items-center justify-center`}>
                <Icon className='w-5 h-5 text-white' />
              </div>
              <Heading as='h1' size='lg'>
                {title}
              </Heading>
            </div>
            <div className='flex items-center space-x-3'>
              {headerActions}
              {headerActions && <div className='hidden sm:block h-6 w-px bg-gray-300'></div>}
              <Text size='sm' variant='muted' className='hidden sm:block'>
                {getFullName(session.user.firstName, session.user.lastName)}
              </Text>
              <Button
                variant="outline"
                size="sm"
                onClick={onSignOut}
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
          {children}
        </div>
      </main>
    </div>
  )
}