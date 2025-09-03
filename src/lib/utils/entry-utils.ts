import { toPlainText } from '@/lib/utils/tiptap-parser'

/**
 * Calculate word count from TipTap JSON content
 */
export function calculateWordCount(content: any): number {
  const plainText = toPlainText(content)
  return plainText.split(/\s+/).filter(word => word.length > 0).length
}

/**
 * Normalize tags to lowercase and trim whitespace
 */
export function normalizeTags(tags: string[]): string[] {
  return tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0)
}

/**
 * Format date for consistent API responses
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toISOString()
}

/**
 * Parse date from string with error handling
 */
export function parseDate(dateStr: string): Date | null {
  try {
    const date = new Date(dateStr)
    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

/**
 * Generate a unique ID for temporary/optimistic updates
 */
export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Extract summary from content (first N characters of plain text)
 */
export function extractSummary(content: any, maxLength = 200): string {
  const plainText = toPlainText(content)
  if (plainText.length <= maxLength) return plainText
  return plainText.substring(0, maxLength).trimEnd() + '...'
}

/**
 * Check if content is empty or only contains whitespace
 */
export function isContentEmpty(content: any): boolean {
  const plainText = toPlainText(content)
  return plainText.trim().length === 0
}

/**
 * Get share status display text
 */
export function getShareStatusText(expiresAt: Date | string | null, isRevoked: boolean): string {
  if (isRevoked) return 'Revoked'
  
  if (!expiresAt) return 'Active'
  
  const expiry = new Date(expiresAt)
  const now = new Date()
  
  if (expiry < now) return 'Expired'
  
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysLeft === 1) return 'Expires tomorrow'
  if (daysLeft <= 7) return `Expires in ${daysLeft} days`
  
  return 'Active'
}