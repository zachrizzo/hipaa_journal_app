import { ReactNode } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { ArrowLeft } from 'lucide-react'

interface AppHeaderProps {
  title: string
  backUrl?: string
  backText?: string
  actions?: ReactNode
  className?: string
  backgroundStyle?: 'default' | 'glass'
}

export function AppHeader({ 
  title, 
  backUrl, 
  backText = 'Back', 
  actions,
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
            <Heading as='h1' size='xl'>
              {title}
            </Heading>
          </div>
          <div className='flex items-center space-x-4'>
            {actions}
          </div>
        </div>
      </div>
    </nav>
  )
}