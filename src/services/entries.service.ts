/**
 * Entries Service
 * Business logic for journal entries
 * Handles data validation, transformation, and coordination with repositories
 */

import { apiClient } from '@/lib/api/client'
import type {
  JournalEntry,
  CreateEntryInput,
  UpdateEntryInput,
  EntryStatus
} from '@/types/database'
import type { EntriesListResponse } from '@/types/api'

export interface EntriesListParams {
  page?: number
  limit?: number
  status?: EntryStatus
  search?: string
}

export interface EntriesListResult extends Pick<EntriesListResponse, 'total' | 'page' | 'totalPages'> {
  entries: JournalEntry[]
}

export class EntriesService {
  // Client-side API calls (for use in React components)
  async createEntry(entryData: CreateEntryInput): Promise<{ id: string }> {
    const response = await apiClient.post<{ id: string }>('/api/entries', entryData)

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create entry')
    }

    return response.data
  }

  async getEntries(params: EntriesListParams = {}): Promise<EntriesListResult> {
    const queryParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined)
    )

    const response = await apiClient.get<EntriesListResponse>('/api/entries', queryParams)

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch entries')
    }

    // Transform response data to JournalEntry format
    const entries = response.data.entries.map(entry => ({
      id: entry.id,
      title: entry.title,
      content: null, // Full content not returned in list
      contentHtml: null,
      encryptedData: null,
      status: entry.status,
      mood: entry.mood,
      tags: entry.tags,
      wordCount: entry.wordCount,
      createdAt: new Date(entry.createdAt),
      updatedAt: new Date(entry.updatedAt),
      publishedAt: entry.publishedAt ? new Date(entry.publishedAt) : null,
      userId: '', // Will be set by API context
      aiSummary: entry.aiSummary,
      aiSummaryAt: entry.aiSummaryAt ? new Date(entry.aiSummaryAt) : null
    }))

    return {
      entries,
      total: response.data.total,
      page: response.data.page,
      totalPages: response.data.totalPages
    }
  }

  async getEntryById(id: string): Promise<JournalEntry | null> {
    const response = await apiClient.get<JournalEntry>(`/api/entries/${id}`)

    if (!response.success) {
      if (response.error?.includes('not found')) {
        return null
      }
      throw new Error(response.error || 'Failed to fetch entry')
    }

    return response.data || null
  }

  async updateEntry(id: string, updates: UpdateEntryInput): Promise<JournalEntry> {
    const response = await apiClient.put<JournalEntry>(`/api/entries/${id}`, updates)

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update entry')
    }

    return response.data
  }

  async deleteEntry(id: string): Promise<void> {
    const response = await apiClient.delete(`/api/entries/${id}`)

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete entry')
    }
  }

  async generateSummary(id: string, saveToDatabase = true): Promise<{ summary: string; wordCount: number; generatedAt: string }> {
    // Use 60 second timeout for summary generation as it can take longer
    const response = await apiClient.post<{ summary: string; wordCount: number; generatedAt: string }>(
      `/api/entries/${id}/summary`, 
      { saveToDatabase },
      60000 // 60 seconds timeout
    )

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to generate summary')
    }

    return response.data
  }
}

// Export singleton instance
export const entriesService = new EntriesService()
