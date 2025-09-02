'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { PageHeader } from '@/components/ui/page-header'
import { Text } from '@/components/ui/text'
import type { Session } from 'next-auth'

interface EntryDetailLayoutProps {
  session: Session | null
  isLoading: boolean
  onSignOut: () => void
  backUrl: string
  backText: string
  title: string
  description?: string
  children: ReactNode
  headerActions?: ReactNode
}

export function EntryDetailLayout({
  session,
  isLoading,
  onSignOut,
  backUrl,
  backText,
  title,
  description,
  children,
  headerActions
}: EntryDetailLayoutProps) {
  return (
    <DashboardLayout
      session={session}
      isLoading={isLoading}
      onSignOut={onSignOut}
      title="HIPAA Journal"
      icon={FileText}
      headerActions={
        <Link 
          href={backUrl}
          className='font-medium text-sm'
        >
          <Text variant='primary'>← {backText}</Text>
        </Link>
      }
    >
      <PageHeader
        title={title}
        description={description}
        actions={headerActions}
      />
      
      {children}
    </DashboardLayout>
  )
}