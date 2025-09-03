import { generateHTML } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'

/**
 * Render TipTap JSON content to HTML
 */
export function renderContent(content: any): string {
  if (!content || typeof content !== 'object') {
    return ''
  }

  try {
    return generateHTML(content, [StarterKit])
  } catch (error) {
    console.error('Failed to render content:', error)
    return ''
  }
}