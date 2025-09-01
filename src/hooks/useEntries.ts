'use client'

import { useState, useEffect } from 'react'
import type { Tables } from '@/types/database'
import type { Session } from 'next-auth'

type JournalEntry = Tables<'journal_entries'>
type SharedEntry = JournalEntry & { 
  shareId: string
  clientName?: string
  shareScope: string
  shareMessage?: string
  sharedAt: string
}

interface UseEntriesProps {
  session: Session | null
  type: 'client' | 'provider'
}

export function useEntries({ session, type }: UseEntriesProps) {
  const [entries, setEntries] = useState<JournalEntry[] | SharedEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchEntries = async (): Promise<void> => {
    if (!session) return
    
    try {
      let response: Response
      
      if (type === 'client') {
        response = await fetch('/api/entries?limit=10')
      } else {
        response = await fetch('/api/shares?type=provided&limit=10')
      }
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        if (type === 'client' && result.data?.entries) {
          // Map client entries
          const mappedEntries = result.data.entries.map((entry: Record<string, unknown>) => ({
            ...entry,
            created_at: entry.createdAt,
            content: entry.aiSummary || 'No preview available'
          }))
          setEntries(mappedEntries)
        } else if (type === 'provider' && result.data) {
          // Map provider shared entries
          const mappedEntries = result.data.map((share: Record<string, unknown>) => ({
            id: share.entryId,
            title: share.entryTitle || 'Untitled Entry',
            content: share.message || 'No preview available',
            status: 'PUBLISHED',
            tags: [],
            created_at: share.createdAt,
            createdAt: share.createdAt,
            mood: null,
            wordCount: 0,
            shareId: share.id,
            clientName: share.clientName,
            shareScope: share.scope,
            shareMessage: share.message,
            sharedAt: share.createdAt
          }))
          setEntries(mappedEntries)
        }
      } else {
        setEntries([])
      }
    } catch (error) {
      console.error(`Failed to fetch ${type} entries:`, error)
      setEntries([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const shouldFetch = session && (
      (type === 'client' && session.user.role === 'CLIENT') ||
      (type === 'provider' && session.user.role === 'PROVIDER')
    )
    
    if (shouldFetch) {
      fetchEntries()
    }
  }, [session, type])

  return {
    entries,
    isLoading,
    refetch: fetchEntries
  }
}