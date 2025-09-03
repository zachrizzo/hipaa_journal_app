'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Stethoscope, Sparkles, Loader2, FileText, Calendar, Brain, Users, ClipboardList, CheckCircle2 } from 'lucide-react'
import { SearchBar } from '@/components/search/SearchBar'
import { EntryGrid } from '@/components/entries/EntryGrid'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useRoleBasedAuth } from '@/hooks/useRoleBasedAuth'
import { useEntries } from '@/hooks/useEntries'
import { entriesService } from '@/services'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { SharedEntry } from '@/services/sharing.service'

export default function ProviderDashboard(): React.JSX.Element {
  const { session, isLoading, handleSignOut } = useRoleBasedAuth({ requiredRole: 'PROVIDER' })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('all')
  const { entries: sharedEntries, isLoading: entriesLoading, refetch } = useEntries({
    session,
    type: 'provider',
    search: searchQuery,
    status: statusFilter === 'all' ? undefined : statusFilter
  })
  const [isGeneratingSummaries, setIsGeneratingSummaries] = useState(false)
  const [summaryProgress, setSummaryProgress] = useState({ current: 0, total: 0 })
  const [summaryMessage, setSummaryMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [combinedSummary, setCombinedSummary] = useState<any>(null)
  const [showSummaryTree, setShowSummaryTree] = useState(false)
  const [summaryErrors, setSummaryErrors] = useState<string[]>([])

  const headerActions = null // Provider dashboard doesn't need header actions in nav

  const generateSummariesForAll = async (): Promise<void> => {
    
    if (sharedEntries.length === 0) {
      setSummaryMessage({ type: 'error', message: 'No entries to generate summaries for' })
      return
    }

    setIsGeneratingSummaries(true)
    setSummaryMessage(null)
    setSummaryErrors([])
    setSummaryProgress({ current: 0, total: sharedEntries.length })

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (let i = 0; i < sharedEntries.length; i++) {
      const entry = sharedEntries[i]
      setSummaryProgress({ current: i + 1, total: sharedEntries.length })

      try {
        
        // Only generate summary if it doesn't exist
        if (!entry.aiSummary) {
          await entriesService.generateSummary(entry.id, true) // Save to database
          successCount++
        }
      } catch (error) {
        errorCount++
        let errorMessage = 'Unknown error'
        
        if (error instanceof Error) {
          // Check for specific error types
          if (error.message.includes('timeout') || error.message.includes('Timeout')) {
            errorMessage = 'Request timed out - entry may be too long'
          } else if (error.message.includes('Network error')) {
            errorMessage = 'Network connection issue'
          } else if (error.message.includes('Failed to generate summary')) {
            errorMessage = 'Summary generation failed'
          } else {
            errorMessage = error.message
          }
        }
        
        errors.push(`${entry.title}: ${errorMessage}`)
      }
    }

    // Refresh the entries to show new summaries
    await refetch()

    // Show result message
    if (errorCount === 0) {
      setSummaryMessage({ 
        type: 'success', 
        message: `Successfully generated ${successCount} summaries!` 
      })
    } else {
      setSummaryMessage({ 
        type: 'error', 
        message: `Generated ${successCount} summaries, but ${errorCount} failed.` 
      })
      setSummaryErrors(errors)
    }

    setIsGeneratingSummaries(false)
    setSummaryProgress({ current: 0, total: 0 })
    
    // Generate combined summary after individual summaries
    if (successCount > 0) {
      await generateCombinedSummary()
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
      // Error generating combined summary
    }
  }
  

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
          <div className="flex items-center gap-3">
            <Button 
              variant='gradient' 
              size='lg' 
              onClick={generateSummariesForAll}
              disabled={isGeneratingSummaries || entriesLoading || sharedEntries.length === 0}
            >
              {isGeneratingSummaries ? (
                <div className="flex items-center gap-3">
                  <Loader2 className='w-5 h-5 animate-spin' />
                  <span>Generating Summaries</span>
                  <Badge variant="secondary" className="ml-2">
                    {summaryProgress.current} / {summaryProgress.total}
                  </Badge>
                </div>
              ) : (
                <>
                  <Sparkles className='w-5 h-5 mr-2' />
                  Generate AI Summaries
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowSummaryTree(true)}
              disabled={!combinedSummary || isGeneratingSummaries}
            >
              <Brain className='w-5 h-5 mr-2' />
              View AI Summary
            </Button>
          </div>
        }
      />

      {/* Progress Bar for Summary Generation */}
      {isGeneratingSummaries && summaryProgress.total > 0 && (
        <div className="mb-6 space-y-2">
          <Progress value={(summaryProgress.current / summaryProgress.total) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            Processing entry {summaryProgress.current} of {summaryProgress.total}
          </p>
        </div>
      )}

      {/* Summary Generation Message */}
      {summaryMessage && (
        <Alert 
          variant={summaryMessage.type === 'error' ? 'destructive' : 'default'} 
          className="mb-6 border-2"
        >
          <AlertTitle>
            {summaryMessage.type === 'error' ? 'Error' : 'Success'}
          </AlertTitle>
          <AlertDescription>
            {summaryMessage.message}
            {summaryMessage.type === 'error' && summaryErrors.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium">View error details</summary>
                <ul className="mt-2 space-y-1">
                  {summaryErrors.map((error, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      • {error}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {/* AI Summary Analysis */}
      {showSummaryTree && combinedSummary && (
        <Card className="mb-6 shadow-lg bg-white">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary text-primary-foreground">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">AI Summary Analysis</CardTitle>
                  <CardDescription className="mt-1">
                    Comprehensive analysis of {combinedSummary.totalEntries} patient entries
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSummaryTree(false)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <FileText className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{combinedSummary.totalEntries}</p>
                <p className="text-sm text-muted-foreground">Total Entries</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-lg font-bold">
                  {new Date(combinedSummary.dateRange.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-sm text-muted-foreground">to {new Date(combinedSummary.dateRange.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{combinedSummary.hierarchicalSummaries?.filter((item: any) => item.level === 'group').length || 0}</p>
                <p className="text-sm text-muted-foreground">Summary Groups</p>
              </div>
            </div>

            {/* Main Summary */}
            <div className="bg-white border border-primary/20 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-3">Overall Summary</h3>
                  <p className="text-foreground leading-relaxed">
                    {combinedSummary.finalSummary}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabbed Content */}
            <Tabs defaultValue="individual" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="individual" className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" />
                  Individual Summaries ({combinedSummary.hierarchicalSummaries?.filter((item: any) => item.level === 'individual').length || 0})
                </TabsTrigger>
                <TabsTrigger value="groups" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Group Summaries ({combinedSummary.hierarchicalSummaries?.filter((item: any) => item.level === 'group').length || 0})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="individual" className="mt-4 space-y-3">
                <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3">
                  {combinedSummary.hierarchicalSummaries && combinedSummary.hierarchicalSummaries
                    .filter((item: any) => item.level === 'individual')
                    .map((summary: any, index: number) => (
                      <Card key={`individual-${index}`} className="border-l-4 border-l-primary">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">Entry #{index + 1}</p>
                                <p className="text-xs text-muted-foreground">{summary.wordCount} words</p>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-foreground leading-relaxed">
                            {summary.summary}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>
              
              <TabsContent value="groups" className="mt-4 space-y-3">
                {combinedSummary.hierarchicalSummaries && combinedSummary.hierarchicalSummaries
                  .filter((item: any) => item.level === 'group')
                  .length > 0 ? (
                    <div className="space-y-3">
                      {combinedSummary.hierarchicalSummaries
                        .filter((item: any) => item.level === 'group')
                        .map((summary: any, index: number) => (
                          <Card key={`group-${index}`} className="border-l-4 border-l-secondary">
                            <CardHeader className="pb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center font-bold text-secondary">
                                  G{index + 1}
                                </div>
                                <div>
                                  <p className="font-medium">Group {index + 1}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Combined {summary.entryIds.length} entries
                                  </p>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <p className="text-sm text-foreground leading-relaxed">
                                {summary.summary}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No group summaries available</p>
                    </div>
                  )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

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