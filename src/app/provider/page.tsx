'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { Stethoscope, Sparkles } from 'lucide-react'
import { SearchBar } from '@/components/search/SearchBar'
import { EntryGrid } from '@/components/entries/EntryGrid'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useRoleBasedAuth } from '@/hooks/useRoleBasedAuth'
import { useEntries } from '@/hooks/useEntries'
import type { SharedEntry } from '@/services/sharing.service'

export default function ProviderDashboard(): React.JSX.Element {
  const { session, isLoading, handleSignOut } = useRoleBasedAuth({ requiredRole: 'PROVIDER' })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('all')
  const { entries: sharedEntries, isLoading: entriesLoading } = useEntries({
    session,
    type: 'provider',
    search: searchQuery,
    status: statusFilter === 'all' ? undefined : statusFilter
  })

  const headerActions = null // Provider dashboard doesn't need header actions in nav

  return (
    <DashboardLayout
      session={session}
      isLoading={isLoading}
      onSignOut={handleSignOut}
      title="Provider Dashboard"
      icon={Stethoscope}
      headerActions={headerActions}
    >
      <PageHeader
        title="Shared Patient Entries"
        description="Review journal entries that patients have shared for medical consultation"
        actions={
          <Button variant='gradient' size='lg'>
            <Sparkles className='w-5 h-5 mr-2' />
            Generate AI Summary
          </Button>
        }
      />

      {/* Search and Filter Bar */}
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter as 'all' | 'DRAFT' | 'PUBLISHED'}
        onStatusFilterChange={(value) => setStatusFilter(value as 'all' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED')}
        placeholder='Search patient entries...'
        statusOptions={[
          { value: 'all', label: 'All Entries' },
          { value: 'PUBLISHED', label: 'Published' },
          { value: 'DRAFT', label: 'Draft' }
        ]}
      />

      {/* Shared Entries Grid */}
      <EntryGrid
        entries={sharedEntries}
        isLoading={entriesLoading}
        emptyStateConfig={{
          title: 'No shared entries',
          description: 'No patients have shared journal entries with you yet',
          actionText: 'Refresh',
          actionHref: '/provider'
        }}
        entryUrlGenerator={(entryId) => {
          // Find the entry to get its shareId  
          const entry = sharedEntries.find(e => e.id === entryId) as SharedEntry | undefined
          return entry?.shareId ? `/provider/shared-entries/${entry.shareId}` : `/provider/entries/${entryId}`
        }}
      />
    </DashboardLayout>
  )
}