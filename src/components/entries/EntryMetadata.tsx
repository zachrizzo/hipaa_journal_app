'use client'

import { Calendar, Clock, Hash, Smile } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { JournalEntry } from '@prisma/client'

interface EntryMetadataProps {
  entry: Pick<JournalEntry, 'createdAt' | 'updatedAt' | 'mood' | 'tags' | 'wordCount' | 'aiSummary' | 'aiSummaryAt'>
  showAiSummary?: boolean
}

export function EntryMetadata({ entry, showAiSummary = true }: EntryMetadataProps) {
  const hasAiSummary = showAiSummary && entry.aiSummary && entry.aiSummaryAt

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>Created {new Date(entry.createdAt).toLocaleString()}</span>
        </div>
        {entry.updatedAt !== entry.createdAt && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Updated {new Date(entry.updatedAt).toLocaleString()}</span>
          </div>
        )}
      </div>

      {entry.mood && (
        <div className="flex items-center gap-2">
          <Smile className="h-4 w-4" />
          <span className="text-sm">Mood: {entry.mood}/10</span>
        </div>
      )}

      {entry.tags && entry.tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Hash className="h-4 w-4 text-muted-foreground" />
          {entry.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {entry.wordCount > 0 && (
        <div className="text-sm text-muted-foreground">
          {entry.wordCount} words
        </div>
      )}

      {hasAiSummary && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium mb-2">AI Summary</p>
          <p className="text-sm text-muted-foreground">{entry.aiSummary}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Generated {new Date(entry.aiSummaryAt!).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  )
}