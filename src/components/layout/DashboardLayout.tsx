'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { LogOut, LucideIcon } from 'lucide-react'
import type { Session } from 'next-auth'

interface DashboardLayoutProps {
  session: Session | null
  isLoading: boolean
  onSignOut: () => void
  title: string
  icon: LucideIcon
  children: ReactNode
  headerActions?: ReactNode
}

export function DashboardLayout({
  session,
  isLoading,
  onSignOut,
  title,
  icon: Icon,
  children,
  headerActions
}: DashboardLayoutProps) {
  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center p-4'>
        <div className="text-center space-y-4">
          <Skeleton className='h-32 w-32 rounded-full mx-auto' />
          <Text variant="muted" size="sm">
            Loading dashboard...
          </Text>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert className="max-w-md">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            <Text variant="muted">
              You must be logged in to access this page.
            </Text>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'>
      {/* Background Pattern */}
      <div className='absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] opacity-20' />
      
      <nav className='relative z-10 bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20' role="navigation" aria-label="Main navigation">
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <div className='flex items-center space-x-3'>
              <div className='w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center' aria-hidden="true">
                <Icon className='w-5 h-5 text-white' />
              </div>
              <Heading as='h1' size='lg'>
                {title}
              </Heading>
            </div>
            <div className='flex items-center space-x-3'>
              {headerActions}
              {headerActions && <div className='hidden sm:block h-6 w-px bg-gray-300' aria-hidden="true"></div>}
              <Button
                variant="outline"
                size="sm"
                onClick={onSignOut}
                aria-label="Sign out of your account"
              >
                <LogOut className='w-4 h-4' aria-hidden="true" />
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