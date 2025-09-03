/**
 * Simple parser for Tiptap JSON content
 */

interface TiptapNode {
  type: string
  content?: TiptapNode[]
  text?: string
  attrs?: Record<string, any>
  marks?: Array<{ type: string; attrs?: Record<string, any> }>
}

/**
 * Extract plain text from Tiptap JSON content
 */
export function extractTextFromTiptap(content: any): string {
  // If it's already a string, return it
  if (typeof content === 'string') {
    return content
  }

  // If it's not an object, stringify it
  if (typeof content !== 'object' || content === null) {
    return String(content)
  }

  // Parse Tiptap JSON structure
  try {
    return extractTextFromNode(content)
  } catch (error) {
    console.error('Error parsing Tiptap content:', error)
    // Fallback to simple string representation
    return JSON.stringify(content)
  }
}

function extractTextFromNode(node: TiptapNode): string {
  let text = ''

  // Handle text nodes
  if (node.text) {
    text += node.text
  }

  // Handle nodes with content
  if (node.content && Array.isArray(node.content)) {
    for (const child of node.content) {
      const childText = extractTextFromNode(child)
      
      // Add appropriate spacing based on node type
      if (childText) {
        if (node.type === 'paragraph' || node.type === 'heading') {
          text += childText + '\n\n'
        } else if (node.type === 'listItem') {
          text += '• ' + childText + '\n'
        } else if (node.type === 'codeBlock') {
          text += '\n' + childText + '\n'
        } else {
          text += childText
        }
      }
    }
  }

  return text.trim()
}

/**
 * Extract text with basic structure preservation
 */
export function extractStructuredText(content: any): string {
  if (typeof content === 'string') {
    return content
  }

  try {
    const doc = content as TiptapNode
    if (doc.type === 'doc' && doc.content) {
      return doc.content
        .map(node => {
          switch (node.type) {
            case 'paragraph':
              return extractTextFromNode(node).trim()
            case 'heading':
              const level = node.attrs?.level || 1
              const prefix = '#'.repeat(level) + ' '
              return prefix + extractTextFromNode(node).trim()
            case 'bulletList':
            case 'orderedList':
              return extractTextFromNode(node)
            case 'codeBlock':
              return '```\n' + extractTextFromNode(node) + '\n```'
            default:
              return extractTextFromNode(node).trim()
          }
        })
        .filter(text => text.length > 0)
        .join('\n\n')
    }
    
    return extractTextFromNode(content)
  } catch (error) {
    console.error('Error extracting structured text:', error)
    return typeof content === 'object' ? JSON.stringify(content) : String(content)
  }
}

/**
 * Convert mixed input (string, TipTap JSON, other) to plain text.
 * - If a string contains JSON representing a TipTap doc, parse and extract text
 * - If an object is provided, treat it as TipTap JSON
 * - Otherwise, coerce to string
 */
export function toPlainText(content: unknown): string {
  if (typeof content === 'string') {
    // Attempt to parse as JSON and extract text when it is an object
    try {
      const parsed = JSON.parse(content)
      if (parsed && typeof parsed === 'object') {
        return extractTextFromTiptap(parsed as any)
      }
    } catch {
      // Not JSON, return as-is
    }
    return content
  }

  if (content && typeof content === 'object') {
    return extractTextFromTiptap(content as any)
  }

  return String(content)
}