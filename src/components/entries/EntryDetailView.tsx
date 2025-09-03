'use client'

import { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EntryMetadata } from '@/components/entries/EntryMetadata'
import { EntryContent } from '@/components/entries/EntryContent'
import type { JournalEntry, EntryShare } from '@prisma/client'

interface EntryDetailViewProps {
  entry: JournalEntry & {
    user?: {
      email: string
      firstName: string | null
      lastName: string | null
    }
  }
  shareData?: EntryShare & {
    client?: {
      email: string
      firstName: string | null
      lastName: string | null
    }
  }
  viewMode: 'client' | 'provider'
  actions?: ReactNode
}

export function EntryDetailView({ 
  entry, 
  shareData,
  viewMode,
  actions 
}: EntryDetailViewProps) {
  const scope = shareData?.scope || 'FULL_ACCESS'
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{entry.title}</CardTitle>
              {viewMode === 'provider' && entry.user && (
                <CardDescription>
                  By {entry.user.firstName} {entry.user.lastName} ({entry.user.email})
                </CardDescription>
              )}
            </div>
            <StatusBadge status={entry.status} />
          </div>
          
          {shareData && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">Share Information</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Access level: {scope.replace('_', ' ').toLowerCase()}</p>
                {shareData.expiresAt && (
                  <p>Expires: {new Date(shareData.expiresAt).toLocaleString()}</p>
                )}
                {shareData.message && (
                  <p className="italic">Note: {shareData.message}</p>
                )}
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          <EntryMetadata 
            entry={entry} 
            showAiSummary={viewMode === 'client' || scope === 'FULL_ACCESS'} 
          />
          
          <div className="border-t pt-6">
            <EntryContent 
              content={entry.content} 
              scope={scope}
              aiSummary={entry.aiSummary}
            />
          </div>
          
          {actions && (
            <div className="border-t pt-6 flex gap-4">
              {actions}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}