import { ReactNode } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { getFullName } from '@/lib/utils'
import type { SessionUser } from '@/types'

interface AppHeaderProps {
  title: string
  backUrl?: string
  backText?: string
  actions?: ReactNode
  user?: SessionUser
  className?: string
  backgroundStyle?: 'default' | 'glass'
}

export function AppHeader({ 
  title, 
  backUrl, 
  backText = 'Back', 
  actions, 
  user,
  className = '',
  backgroundStyle = 'default'
}: AppHeaderProps) {
  const navClasses = backgroundStyle === 'glass' 
    ? 'relative z-10 bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20'
    : 'bg-card shadow-sm border-b'

  return (
    <nav className={`${navClasses} ${className}`}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          <div className='flex items-center space-x-4'>
            {backUrl && (
              <Button variant="ghost" asChild>
                <Link href={backUrl}>
                  <ArrowLeft className='w-4 h-4 mr-2' />
                  {backText}
                </Link>
              </Button>
            )}
            <h1 className='text-xl font-semibold'>
              {title}
            </h1>
          </div>
          <div className='flex items-center space-x-4'>
            {actions}
            {user && (
              <span className='text-sm text-muted-foreground'>
                {getFullName(user.firstName, user.lastName)}
              </span>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}