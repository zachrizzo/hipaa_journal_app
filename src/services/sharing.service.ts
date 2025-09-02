/**
 * Sharing Service
 * Business logic for entry sharing functionality
 * Handles provider-client sharing, permissions, and access control
 */

import { apiClient } from '@/lib/api/client'
import type { ShareListResponse, ProviderListResponse, CreateShareRequestParams } from '@/types/api'
import type { JournalEntry, EntryStatus, EntryShare, EntryShareWithRelationsData, ShareScope } from '@/types/database'

export type CreateShareData = CreateShareRequestParams

export interface ShareFilters {
  type?: 'provided' | 'received'
  limit?: number
  search?: string
}

export interface SharedEntry extends JournalEntry {
  shareId: EntryShare['id']
  clientName?: string
  shareScope: ShareScope
  shareMessage?: EntryShare['message']
  sharedAt: string
}

export class SharingService {
  async createShare(shareData: CreateShareData): Promise<{ id: string }> {
    const response = await apiClient.post<{ id: string }>('/api/shares', shareData)

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create share')
    }

    return response.data
  }

  async getShares(filters: ShareFilters = {}): Promise<SharedEntry[]> {
    const queryParams = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined)
    )

    const response = await apiClient.get<ShareListResponse[]>('/api/shares', queryParams)

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch shares')
    }

    // Transform to SharedEntry format
    return response.data.map((share: ShareListResponse): SharedEntry => ({
      id: share.entryId as string,
      title: share.entryTitle || 'Untitled Entry',
      content: null,
      contentHtml: null,
      encryptedData: null,
      status: 'PUBLISHED' as EntryStatus,
      mood: null,
      tags: [],
      wordCount: 0,
      createdAt: new Date(share.createdAt),
      updatedAt: new Date(share.createdAt),
      publishedAt: new Date(share.createdAt),
      userId: '',
      aiSummary: null,
      aiSummaryAt: null,
      shareId: share.id,
      clientName: share.clientName || undefined,
      shareScope: share.scope,
      shareMessage: share.message || undefined,
      sharedAt: share.createdAt
    }))
  }

  async getShareById(shareId: string): Promise<EntryShareWithRelationsData | null> {
    const response = await apiClient.get<EntryShareWithRelationsData>(`/api/shares/${shareId}`)

    if (!response.success) {
      if (response.error?.includes('not found')) {
        return null
      }
      throw new Error(response.error || 'Failed to fetch share')
    }

    return response.data || null
  }

  async updateShare(shareId: string, updates: Partial<CreateShareData>): Promise<EntryShare> {
    const response = await apiClient.put<EntryShare>(`/api/shares/${shareId}`, updates)

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update share')
    }

    return response.data
  }

  async revokeShare(shareId: string): Promise<void> {
    const response = await apiClient.delete(`/api/shares/${shareId}`)

    if (!response.success) {
      throw new Error(response.error || 'Failed to revoke share')
    }
  }

  async getProviders(): Promise<ProviderListResponse[]> {
    const response = await apiClient.get<ProviderListResponse[]>('/api/providers')

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch providers')
    }

    return response.data ?? []
  }
}

// Export singleton instance
export const sharingService = new SharingService()
