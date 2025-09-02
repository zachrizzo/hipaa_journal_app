'use client'

import { useState, useEffect, useCallback } from 'react'
import { entriesService, sharingService } from '@/services'
import type { JournalEntry } from '@/types/database'
import type { SharedEntry } from '@/services/sharing.service'
import type { Session } from 'next-auth'

interface UseEntriesProps {
  session: Session | null
  type: 'client' | 'provider'
  search?: string
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
}

export function useEntries({ session, type, search, status }: UseEntriesProps) {
  const [entries, setEntries] = useState<JournalEntry[] | SharedEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEntries = useCallback(async (): Promise<void> => {
    if (!session) return

    try {
      setError(null)
      setIsLoading(true)

      if (type === 'client') {
        const result = await entriesService.getEntries({
          limit: 10,
          search: search || undefined,
          status: status || undefined
        })
        setEntries(result.entries)
      } else {
        // Server API does not support search/status for shares yet; fetch then filter client-side
        const shares = await sharingService.getShares({ type: 'provided', limit: 10 })
        const filtered = shares.filter((s) => {
          const matchesSearch = (search || '').trim().length === 0
            || s.title.toLowerCase().includes((search || '').toLowerCase())
            || (s.clientName || '').toLowerCase().includes((search || '').toLowerCase())

          const matchesStatus = !status || status === 'PUBLISHED' // shared entries are effectively published

          return matchesSearch && matchesStatus
        })
        setEntries(filtered)
      }
    } catch (error) {
      console.error(`Failed to fetch ${type} entries:`, error)
      setError(error instanceof Error ? error.message : 'Failed to fetch entries')
      setEntries([])
    } finally {
      setIsLoading(false)
    }
  }, [session, type, search, status])

  useEffect(() => {
    const shouldFetch = session && (
      (type === 'client' && session.user.role === 'CLIENT') ||
      (type === 'provider' && session.user.role === 'PROVIDER')
    )

    if (shouldFetch) {
      fetchEntries()
    }
  }, [session, type, search, status, fetchEntries])

  return {
    entries,
    isLoading,
    error,
    refetch: fetchEntries
  }
}