'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Text } from '@/components/ui/text'
import { Brain, FileText, Calendar, Users, CheckCircle2, ClipboardList } from 'lucide-react'

interface SummaryDisplayProps {
  summary: {
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
  }
  onClose: () => void
}

export function SummaryDisplay({ summary, onClose }: SummaryDisplayProps) {
  const groupSummaries = summary.hierarchicalSummaries?.filter(item => item.level === 'group') || []

  return (
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
                Comprehensive analysis of {summary.totalEntries} patient entries
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
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
            <Text size="2xl" weight="bold" className="block">{summary.totalEntries}</Text>
            <Text size="sm" variant="muted" className="block">Total Entries</Text>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-primary" />
            <Text size="lg" weight="bold" className="block">
              {new Date(summary.dateRange.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
            <Text size="sm" variant="muted" className="block">
              to {new Date(summary.dateRange.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
            <Text size="2xl" weight="bold" className="block">{groupSummaries.length}</Text>
            <Text size="sm" variant="muted" className="block">Summary Groups</Text>
          </div>
        </div>

        {/* Main Summary */}
        <div className="bg-white border border-primary/20 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
            <div className="flex-1">
              <Text as="h3" size="lg" weight="semibold" className="block mb-3">Overall Summary</Text>
              <Text className="block" leading="relaxed">
                {summary.finalSummary}
              </Text>
            </div>
          </div>
        </div>

        {/* Hierarchical Summaries */}
        {summary.hierarchicalSummaries && summary.hierarchicalSummaries.length > 0 && (
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5 text-primary" />
              <Text as="h3" size="lg" weight="semibold">Detailed Analysis by Group</Text>
            </div>
            
            <div className="space-y-4">
              {summary.hierarchicalSummaries
                .filter(item => item.level === 'group')
                .map((group, index) => (
                  <div key={index} className="bg-muted/30 rounded-lg p-4 border border-primary/10">
                    <div className="mb-3">
                      <Text weight="medium" className="block mb-2">Group {index + 1} Summary</Text>
                      <Text size="sm" className="block" leading="relaxed">
                        {group.summary}
                      </Text>
                    </div>
                    
                    {group.entries && group.entries.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-primary/10">
                        <Text size="sm" weight="medium" variant="muted" className="block mb-2">
                          Entries in this group:
                        </Text>
                        <ul className="space-y-1">
                          {group.entries.map((entry, entryIndex) => (
                            <li key={entryIndex}>
                              <Text size="sm" variant="muted" className="flex items-start">
                                <span className="inline-block w-4 text-center">•</span>
                                <span className="flex-1">
                                  {entry.title} 
                                  <span className="text-xs ml-2">
                                    ({new Date(entry.timestamp).toLocaleDateString()})
                                  </span>
                                </span>
                              </Text>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}