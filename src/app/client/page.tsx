'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { FileText, PlusCircle } from 'lucide-react'
import { SearchBar } from '@/components/search/SearchBar'
import { EntryGrid } from '@/components/entries/EntryGrid'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useRoleBasedAuth } from '@/hooks/useRoleBasedAuth'
import { useEntries } from '@/hooks/useEntries'

export default function ClientDashboard(): React.JSX.Element {
  const { session, isLoading, handleSignOut } = useRoleBasedAuth({ requiredRole: 'CLIENT' })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('all')
  const { entries, isLoading: entriesLoading } = useEntries({
    session,
    type: 'client',
    search: searchQuery,
    status: statusFilter === 'all' ? undefined : statusFilter
  })

  const headerActions = (
    <Button variant='gradient' size='sm' asChild>
      <Link href='/client/entries/new'>
        <PlusCircle className='w-4 h-4 mr-2' />
        New Entry
      </Link>
    </Button>
  )

  return (
    <DashboardLayout
      session={session}
      isLoading={isLoading}
      onSignOut={handleSignOut}
      title="HIPAA Journal"
      icon={FileText}
      headerActions={headerActions}
    >
      <PageHeader
        title="Your Journal Entries"
        description="Document your thoughts, experiences, and professional insights"
      />

      {/* Search and Filter Bar */}
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter as 'all' | 'DRAFT' | 'PUBLISHED'}
        onStatusFilterChange={setStatusFilter}
        placeholder='Search your entries...'
      />

      {/* Journal Entries Grid */}
      <EntryGrid
        entries={entries}
        isLoading={entriesLoading}
        emptyStateConfig={{
          title: 'No entries yet',
          description: 'Start your journaling journey by creating your first entry',
          actionText: 'Create Your First Entry',
          actionHref: '/client/entries/new'
        }}
        entryUrlGenerator={(entryId) => `/client/entries/${entryId}`}
      />
    </DashboardLayout>
  )
}