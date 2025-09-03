'use client'

import { useMemo } from 'react'
import { renderContent } from '@/lib/utils/render-content'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock } from 'lucide-react'

interface EntryContentProps {
  content: any
  scope?: 'FULL_ACCESS' | 'TITLE_ONLY' | 'SUMMARY_ONLY' | 'NONE'
  aiSummary?: string | null
  className?: string
}

export function EntryContent({ 
  content, 
  scope = 'FULL_ACCESS', 
  aiSummary,
  className = '' 
}: EntryContentProps) {
  const renderedContent = useMemo(() => {
    if (scope === 'TITLE_ONLY') {
      return (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            You have title-only access to this entry. The content is not available.
          </AlertDescription>
        </Alert>
      )
    }

    if (scope === 'SUMMARY_ONLY') {
      return aiSummary ? (
        <div className="space-y-4">
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              You have summary-only access to this entry. Below is the AI-generated summary.
            </AlertDescription>
          </Alert>
          <div className="prose prose-sm max-w-none">
            <p>{aiSummary}</p>
          </div>
        </div>
      ) : (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            You have summary-only access to this entry, but no summary is available yet.
          </AlertDescription>
        </Alert>
      )
    }

    // FULL_ACCESS
    return (
      <div 
        className={`prose prose-sm max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: renderContent(content) }} 
      />
    )
  }, [content, scope, aiSummary, className])

  return renderedContent
}