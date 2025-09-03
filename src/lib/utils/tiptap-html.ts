/**
 * Convert TipTap JSON to HTML for display
 */

interface TiptapNode {
  type: string
  content?: TiptapNode[]
  text?: string
  attrs?: Record<string, unknown>
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
}

/**
 * Convert TipTap JSON content to HTML
 * This is used for rendering content that was stored as JSON
 */
export function tiptapToHtml(content: unknown): string {
  // If it's already a string, return it
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content)
      return nodeToHtml(parsed)
    } catch {
      // If parsing fails, assume it's already HTML
      return content
    }
  }

  // If it's not an object, stringify it
  if (typeof content !== 'object' || content === null) {
    return String(content)
  }

  // Parse TipTap JSON structure
  try {
    return nodeToHtml(content as TiptapNode)
  } catch {
    // Fallback to simple string representation
    return JSON.stringify(content)
  }
}

function nodeToHtml(node: TiptapNode): string {
  // Handle text nodes
  if (node.text !== undefined) {
    let text = escapeHtml(node.text)
    
    // Apply marks
    if (node.marks && Array.isArray(node.marks)) {
      for (const mark of node.marks) {
        text = applyMark(text, mark)
      }
    }
    
    return text
  }

  // Handle nodes with content
  let html = ''
  if (node.content && Array.isArray(node.content)) {
    html = node.content.map(child => nodeToHtml(child)).join('')
  }

  // Wrap content based on node type
  switch (node.type) {
    case 'doc':
      return html
    case 'paragraph':
      return `<p>${html}</p>`
    case 'heading':
      const level = node.attrs?.level || 1
      return `<h${level}>${html}</h${level}>`
    case 'blockquote':
      return `<blockquote>${html}</blockquote>`
    case 'bulletList':
      return `<ul>${html}</ul>`
    case 'orderedList':
      return `<ol>${html}</ol>`
    case 'listItem':
      return `<li>${html}</li>`
    case 'codeBlock':
      const lang = String(node.attrs?.language || '')
      return `<pre><code class="language-${escapeHtml(lang)}">${html}</code></pre>`
    case 'hardBreak':
      return '<br>'
    case 'horizontalRule':
      return '<hr>'
    default:
      return html
  }
}

function applyMark(text: string, mark: { type: string; attrs?: Record<string, unknown> }): string {
  switch (mark.type) {
    case 'bold':
      return `<strong>${text}</strong>`
    case 'italic':
      return `<em>${text}</em>`
    case 'code':
      return `<code>${text}</code>`
    case 'link':
      const href = String(mark.attrs?.href || '#')
      const target = String(mark.attrs?.target || '_blank')
      return `<a href="${escapeHtml(href)}" target="${escapeHtml(target)}" rel="noopener noreferrer">${text}</a>`
    case 'strike':
      return `<del>${text}</del>`
    default:
      return text
  }
}

function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }
  
  return str.replace(/[&<>"']/g, char => htmlEscapes[char] || char)
}