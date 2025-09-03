'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Text } from '@/components/ui/text'
import { Stethoscope, Brain, Sparkles, Loader2 } from 'lucide-react'
import { SearchBar } from '@/components/search/SearchBar'
import { EntryGrid } from '@/components/entries/EntryGrid'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useRoleBasedAuth } from '@/hooks/useRoleBasedAuth'
import { useEntries } from '@/hooks/useEntries'
import { SummaryDisplay } from '@/components/provider/SummaryDisplay'
import { entriesService } from '@/services'
import type { SharedEntry } from '@/services/sharing.service'

export default function ProviderDashboard(): React.JSX.Element {
  const { session, isLoading, handleSignOut } = useRoleBasedAuth({ requiredRole: 'PROVIDER' })
  const [searchQuery, setSearchQuery] = useState('')
  const { entries: sharedEntries, isLoading: entriesLoading, refetch } = useEntries({
    session,
    type: 'provider',
    search: searchQuery
  })
  const [combinedSummary, setCombinedSummary] = useState<{
    totalEntries: number
    dateRange: {
      start: string
      end: string
    }
    finalSummary: string
    hierarchicalSummaries?: Array<{
      level: 'group' | 'entry'
      summary: string
      entries?: Array<{
        title: string
        timestamp: string
      }>
    }>
  } | null>(null)
  const [showSummaryTree, setShowSummaryTree] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [message, setMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [isPostProcessing, setIsPostProcessing] = useState(false)

  const generateAllSummaries = async (): Promise<void> => {
    if (sharedEntries.length === 0) {
      setMessage({ type: 'error', message: 'No entries to generate summaries for' })
      return
    }

    setIsGenerating(true)
    setMessage(null)
    setProgress({ current: 0, total: sharedEntries.length })

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < sharedEntries.length; i++) {
      const entry = sharedEntries[i]
      setProgress({ current: i + 1, total: sharedEntries.length })

      try {
        if (!entry.aiSummary) {
          await entriesService.generateSummary(entry.id, true)
          successCount++
        }
      } catch (error) {
        errorCount++
      }
    }

    setIsGenerating(false)
    setProgress({ current: 0, total: 0 })
    setIsPostProcessing(true)

    if (errorCount === 0) {
      setMessage({ 
        type: 'success', 
        message: `Successfully generated ${successCount} summaries!` 
      })
    } else {
      setMessage({ 
        type: 'error', 
        message: `Generated ${successCount} summaries, but ${errorCount} failed.` 
      })
    }

    try {
      await refetch()
      if (successCount > 0) {
        await generateCombinedSummary()
      }
    } finally {
      setIsPostProcessing(false)
    }
  }
  
  const generateCombinedSummary = async (): Promise<void> => {
    try {
      const entryIds = sharedEntries.map(e => e.id)
      const response = await fetch('/api/summaries/combined', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryIds,
          groupSize: 3,
          saveIndividualSummaries: true
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate combined summary')
      }
      
      const data = await response.json()
      setCombinedSummary(data.data)
      setShowSummaryTree(true)
    } catch (error) {
      console.error('Failed to generate combined summary:', error)
    }
  }

  return (
    <DashboardLayout
      session={session}
      isLoading={isLoading}
      onSignOut={handleSignOut}
      title="Provider Dashboard"
      icon={Stethoscope}
    >
      <PageHeader
        title="Shared Patient Entries"
        description="Review journal entries that patients have shared for medical consultation"
        actions={
          <div className="flex items-center gap-3">
            <Button 
              variant='gradient' 
              size='lg' 
              onClick={generateAllSummaries}
              disabled={entriesLoading || isGenerating || sharedEntries.length === 0}
            >
              {isGenerating ? (
                <>
                  <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                  Generating {progress.current}/{progress.total}
                </>
              ) : (
                <>
                  <Sparkles className='w-5 h-5 mr-2' />
                  Generate AI Summaries
                </>
              )}
            </Button>
            {combinedSummary && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowSummaryTree(true)}
              >
                <Brain className='w-5 h-5 mr-2' />
                View AI Summary
              </Button>
            )}
          </div>
        }
      />

      {/* Progress and Status Messages */}
      {(isGenerating || message || isPostProcessing) && (
        <div className="mb-6 space-y-4">
          {isGenerating && progress.total > 0 && (
            <div className="space-y-2">
              <Progress value={(progress.current / progress.total) * 100} className="h-2" />
              <Text size="xs" variant="muted" align="center" className="block">
                Processing entry {progress.current} of {progress.total}
              </Text>
            </div>
          )}

          {message && (
            <Alert 
              variant={message.type === 'error' ? 'destructive' : 'default'} 
              className="border-2"
            >
              <AlertTitle>
                {message.type === 'error' ? 'Error' : 'Success'}
              </AlertTitle>
              <AlertDescription>
                {message.message}
              </AlertDescription>
            </Alert>
          )}

          {isPostProcessing && (
            <Alert>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <AlertDescription>
                Updating entries and generating combined analysis...
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* AI Summary Analysis */}
      {showSummaryTree && combinedSummary && (
        <SummaryDisplay 
          summary={combinedSummary} 
          onClose={() => setShowSummaryTree(false)} 
        />
      )}
      
      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar 
          placeholder="Search by title or client name..."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter="all"
          onStatusFilterChange={() => {}}
        />
      </div>

      {/* Shared Entries Grid */}
      <EntryGrid
        entries={sharedEntries}
        isLoading={entriesLoading}
        entryUrlGenerator={(id) => {
          // Find the share ID for this entry
          const sharedEntry = sharedEntries.find(e => e.id === id)
          return `/provider/shared-entries/${(sharedEntry as SharedEntry)?.shareId || id}`
        }}
        emptyStateConfig={{
          title: "No shared entries",
          description: "You don't have any patient entries shared with you yet.",
          actionText: "",
          actionHref: ""
        }}
      />
    </DashboardLayout>
  )
}