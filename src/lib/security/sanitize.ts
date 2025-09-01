import DOMPurify from 'isomorphic-dompurify'

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'sub', 'sup',
  'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'pre', 'code', 'mark', 'del', 'ins'
]

const ALLOWED_ATTRIBUTES = {
  '*': ['class', 'data-*'],
  'blockquote': ['cite'],
  'pre': ['data-language'],
  'code': ['data-language']
}

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: Object.keys(ALLOWED_ATTRIBUTES).reduce((acc, tag) => {
      ALLOWED_ATTRIBUTES[tag as keyof typeof ALLOWED_ATTRIBUTES]?.forEach(attr => {
        if (!acc.includes(attr)) {
          acc.push(attr)
        }
      })
      return acc
    }, [] as string[]),
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'button'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
    ALLOW_DATA_ATTR: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    SANITIZE_DOM: true
  })
}

export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, '')
    .trim()
    .substring(0, 10000) // Limit text length
}

export function validateTipTapContent(content: unknown): boolean {
  if (!content || typeof content !== 'object') {
    return false
  }

  const contentObj = content as Record<string, unknown>
  
  if (contentObj.type !== 'doc' || !Array.isArray(contentObj.content)) {
    return false
  }

  return validateTipTapNodes(contentObj.content as unknown[])
}

function validateTipTapNodes(nodes: unknown[]): boolean {
  for (const node of nodes) {
    if (!node || typeof node !== 'object') {
      return false
    }

    const nodeObj = node as Record<string, unknown>
    
    if (typeof nodeObj.type !== 'string') {
      return false
    }

    // Allow only safe node types
    const allowedTypes = [
      'doc', 'paragraph', 'text', 'heading', 'bulletList', 'orderedList', 'listItem',
      'blockquote', 'codeBlock', 'horizontalRule', 'hardBreak'
    ]

    if (!allowedTypes.includes(nodeObj.type)) {
      return false
    }

    // Recursively validate child nodes
    if (Array.isArray(nodeObj.content)) {
      if (!validateTipTapNodes(nodeObj.content as unknown[])) {
        return false
      }
    }

    // Validate marks (formatting)
    if (Array.isArray(nodeObj.marks)) {
      const allowedMarks = ['bold', 'italic', 'underline', 'strike', 'code', 'subscript', 'superscript']
      for (const mark of nodeObj.marks as unknown[]) {
        if (!mark || typeof mark !== 'object') {
          return false
        }
        const markObj = mark as Record<string, unknown>
        if (typeof markObj.type !== 'string' || !allowedMarks.includes(markObj.type)) {
          return false
        }
      }
    }
  }

  return true
}

export function stripPotentiallyDangerousContent(content: string): string {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
}