'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Text } from '@/components/ui/text'
import { Sparkles, Loader2 } from 'lucide-react'
import { entriesService } from '@/services'
import type { SharedEntry } from '@/services/sharing.service'

interface SummaryGeneratorProps {
  entries: SharedEntry[]
  onRefetch: () => Promise<void>
  onSummaryGenerated: (combinedSummary: any) => void
  disabled?: boolean
}

export function SummaryGenerator({ 
  entries, 
  onRefetch, 
  onSummaryGenerated,
  disabled = false 
}: SummaryGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [message, setMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [isPostProcessing, setIsPostProcessing] = useState(false)

  const generateSummariesForAll = async (): Promise<void> => {
    if (entries.length === 0) {
      setMessage({ type: 'error', message: 'No entries to generate summaries for' })
      return
    }

    setIsGenerating(true)
    setMessage(null)
    setErrors([])
    setProgress({ current: 0, total: entries.length })

    let successCount = 0
    let errorCount = 0
    const errorList: string[] = []

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      setProgress({ current: i + 1, total: entries.length })

      try {
        // Only generate summary if it doesn't exist
        if (!entry.aiSummary) {
          await entriesService.generateSummary(entry.id, true)
          successCount++
        }
      } catch (error) {
        errorCount++
        let errorMessage = 'Unknown error'
        
        if (error instanceof Error) {
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
        
        errorList.push(`${entry.title}: ${errorMessage}`)
      }
    }

    setIsGenerating(false)
    setProgress({ current: 0, total: 0 })
    setIsPostProcessing(true)

    // Show result message
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
      setErrors(errorList)
    }

    try {
      // Refresh entries and generate combined summary
      await onRefetch()
      
      if (successCount > 0) {
        await generateCombinedSummary()
      }
    } finally {
      setIsPostProcessing(false)
    }
  }
  
  const generateCombinedSummary = async (): Promise<void> => {
    try {
      const entryIds = entries.map(e => e.id)
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
      onSummaryGenerated(data.data)
    } catch (error) {
      console.error('Failed to generate combined summary:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button 
          variant='gradient' 
          size='lg' 
          onClick={generateSummariesForAll}
          disabled={disabled || isGenerating || isPostProcessing || entries.length === 0}
        >
          {isGenerating ? (
            <div className="flex items-center gap-3">
              <Loader2 className='w-5 h-5 animate-spin' />
              <Text>Generating Summaries</Text>
              <Badge variant="secondary" className="ml-2">
                {progress.current} / {progress.total}
              </Badge>
            </div>
          ) : (
            <>
              <Sparkles className='w-5 h-5 mr-2' />
              Generate AI Summaries
            </>
          )}
        </Button>
      </div>

      {/* Progress Bar */}
      {isGenerating && progress.total > 0 && (
        <div className="space-y-2">
          <Progress value={(progress.current / progress.total) * 100} className="h-2" />
          <Text size="xs" variant="muted" align="center" className="block">
            Processing entry {progress.current} of {progress.total}
          </Text>
        </div>
      )}

      {/* Result Message */}
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
            {message.type === 'error' && errors.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium">View error details</summary>
                <ul className="mt-2 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>
                      <Text size="sm" variant="muted">• {error}</Text>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Post-Processing Indicator */}
      {isPostProcessing && (
        <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <Text size="sm" className="text-blue-700">
            Updating entries and generating combined analysis...
          </Text>
        </div>
      )}
    </div>
  )
}