'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Stethoscope, Sparkles } from 'lucide-react'
import { SearchBar } from '@/components/search/SearchBar'
import { EntryGrid } from '@/components/entries/EntryGrid'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useRoleBasedAuth } from '@/hooks/useRoleBasedAuth'
import { useEntries } from '@/hooks/useEntries'

export default function ProviderDashboard(): React.JSX.Element {
  const { session, isLoading, handleSignOut } = useRoleBasedAuth({ requiredRole: 'PROVIDER' })
  const { entries: sharedEntries, isLoading: entriesLoading } = useEntries({ session, type: 'provider' })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'DRAFT' | 'PUBLISHED'>('all')

  const headerActions = null // Provider dashboard doesn't need header actions in nav

  return (
    <DashboardLayout
      session={session}
      isLoading={isLoading}
      onSignOut={handleSignOut}
      title="Provider Dashboard"
      gradientFrom="from-green-600"
      gradientTo="to-teal-600"
      icon={Stethoscope}
      headerActions={headerActions}
    >
      {/* Header Section */}
      <div className='flex items-center justify-between mb-8'>
        <div>
          <Heading as='h1' size='3xl' variant='gradient' className='mb-2'>
            Shared Patient Entries
          </Heading>
          <Text size='lg' variant='muted'>
            Review journal entries that patients have shared for medical consultation
          </Text>
        </div>
        <Button variant='gradient' size='lg'>
          <Sparkles className='w-5 h-5 mr-2' />
          Generate AI Summary
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={(value) => setStatusFilter(value as 'all' | 'DRAFT' | 'PUBLISHED')}
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
          const entry = sharedEntries.find(e => e.id === entryId)
          return (entry as any)?.shareId ? `/provider/shared-entries/${(entry as any).shareId}` : `/provider/entries/${entryId}`
        }}
      />
    </DashboardLayout>
  )
}