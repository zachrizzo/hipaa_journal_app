// Utility functions for journal entry display and formatting

export const getMoodEmoji = (mood?: number | null): string => {
  if (!mood) return '😐'
  const moodEmojis = ['😢', '😞', '😐', '😕', '😔', '😐', '🙂', '😊', '😄', '😁']
  return moodEmojis[mood - 1] || '😐'
}

export const getMoodLabel = (mood?: number | null): string => {
  if (!mood) return 'Not specified'
  const moodLabels = ['Terrible', 'Bad', 'Poor', 'Below Average', 'Average', 'Above Average', 'Good', 'Great', 'Excellent', 'Outstanding']
  return moodLabels[mood - 1] || 'Unknown'
}

export const renderContent = (content: unknown): string => {
  if (typeof content === 'string') {
    return content
  }

  try {
    const data = content as Record<string, unknown>
    if (data?.content && Array.isArray(data.content)) {
      return data.content
        .map((node: unknown) => {
          const nodeData = node as Record<string, unknown>
          if (nodeData?.type === 'paragraph' && Array.isArray(nodeData.content)) {
            return nodeData.content
              .map((textNode: unknown) => {
                const textData = textNode as Record<string, unknown>
                return String(textData?.text || '')
              })
              .join('')
          }
          return ''
        })
        .join('\n\n')
    }
    return JSON.stringify(content)
  } catch {
    return 'Content could not be displayed'
  }
}

export const formatDate = (date: string | Date): string => {
  // Handle both Date objects and string inputs
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getScopeColor = (scope: string): string => {
  switch (scope) {
    case 'FULL_ACCESS':
      return 'bg-green-100 text-green-800'
    case 'SUMMARY_ONLY':
      return 'bg-yellow-100 text-yellow-800'
    case 'TITLE_ONLY':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export const getScopeLabel = (scope: string): string => {
  switch (scope) {
    case 'FULL_ACCESS':
      return 'Full Access'
    case 'SUMMARY_ONLY':
      return 'Summary Only'
    case 'TITLE_ONLY':
      return 'Title Only'
    default:
      return 'No Access'
  }
}