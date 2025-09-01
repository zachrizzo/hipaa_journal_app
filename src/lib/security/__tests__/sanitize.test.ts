import { 
  sanitizeHtml, 
  sanitizeText, 
  validateTipTapContent,
  stripPotentiallyDangerousContent 
} from '../sanitize'

describe('sanitizeHtml', () => {
  it('should allow safe HTML tags', () => {
    const input = '<p>Hello <strong>world</strong>!</p>'
    const result = sanitizeHtml(input)
    expect(result).toBe('<p>Hello <strong>world</strong>!</p>')
  })

  it('should remove dangerous script tags', () => {
    const input = '<p>Hello</p><script>alert("xss")</script>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('<script>')
    expect(result).toContain('<p>Hello</p>')
  })

  it('should remove iframe tags', () => {
    const input = '<p>Hello</p><iframe src="http://evil.com"></iframe>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('<iframe>')
    expect(result).toContain('<p>Hello</p>')
  })

  it('should remove onclick attributes', () => {
    const input = '<p onclick="alert(\'xss\')">Click me</p>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('onclick')
    expect(result).toContain('Click me')
  })

  it('should preserve allowed formatting', () => {
    const input = '<h1>Title</h1><p>Text with <em>emphasis</em> and <strong>bold</strong></p><ul><li>Item</li></ul>'
    const result = sanitizeHtml(input)
    expect(result).toContain('<h1>Title</h1>')
    expect(result).toContain('<em>emphasis</em>')
    expect(result).toContain('<strong>bold</strong>')
    expect(result).toContain('<ul><li>Item</li></ul>')
  })
})

describe('sanitizeText', () => {
  it('should remove angle brackets', () => {
    const input = 'Hello <script>alert("xss")</script> world'
    const result = sanitizeText(input)
    expect(result).not.toContain('<')
    expect(result).not.toContain('>')
    expect(result).toBe('Hello scriptalert("xss")/script world')
  })

  it('should trim whitespace', () => {
    const input = '  Hello world  '
    const result = sanitizeText(input)
    expect(result).toBe('Hello world')
  })

  it('should limit text length', () => {
    const input = 'a'.repeat(15000)
    const result = sanitizeText(input)
    expect(result.length).toBe(10000)
  })
})

describe('validateTipTapContent', () => {
  it('should accept valid TipTap document structure', () => {
    const validContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Hello world'
            }
          ]
        }
      ]
    }
    expect(validateTipTapContent(validContent)).toBe(true)
  })

  it('should reject invalid document type', () => {
    const invalidContent = {
      type: 'invalid',
      content: []
    }
    expect(validateTipTapContent(invalidContent)).toBe(false)
  })

  it('should reject documents without content array', () => {
    const invalidContent = {
      type: 'doc'
    }
    expect(validateTipTapContent(invalidContent)).toBe(false)
  })

  it('should reject dangerous node types', () => {
    const dangerousContent = {
      type: 'doc',
      content: [
        {
          type: 'script',
          content: [
            {
              type: 'text',
              text: 'alert("xss")'
            }
          ]
        }
      ]
    }
    expect(validateTipTapContent(dangerousContent)).toBe(false)
  })

  it('should accept safe formatting marks', () => {
    const contentWithMarks = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Bold text',
              marks: [{ type: 'bold' }]
            }
          ]
        }
      ]
    }
    expect(validateTipTapContent(contentWithMarks)).toBe(true)
  })

  it('should reject dangerous marks', () => {
    const contentWithDangerousMarks = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Text with link',
              marks: [{ type: 'link', attrs: { href: 'javascript:alert("xss")' } }]
            }
          ]
        }
      ]
    }
    expect(validateTipTapContent(contentWithDangerousMarks)).toBe(false)
  })
})

describe('stripPotentiallyDangerousContent', () => {
  it('should remove script tags', () => {
    const input = 'Hello <script>alert("xss")</script> world'
    const result = stripPotentiallyDangerousContent(input)
    expect(result).not.toContain('<script>')
    expect(result).toBe('Hello  world')
  })

  it('should remove iframe tags', () => {
    const input = 'Hello <iframe src="evil.com"></iframe> world'
    const result = stripPotentiallyDangerousContent(input)
    expect(result).not.toContain('<iframe>')
    expect(result).toBe('Hello  world')
  })

  it('should remove javascript: URLs', () => {
    const input = 'Click <a href="javascript:alert(1)">here</a>'
    const result = stripPotentiallyDangerousContent(input)
    expect(result).not.toContain('javascript:')
    expect(result).toContain('<a href="')
  })

  it('should remove data: URLs', () => {
    const input = '<img src="data:text/html,<script>alert(1)</script>">'
    const result = stripPotentiallyDangerousContent(input)
    expect(result).not.toContain('data:')
  })

  it('should remove event handlers', () => {
    const input = '<div onclick="alert(1)" onmouseover="alert(2)">Content</div>'
    const result = stripPotentiallyDangerousContent(input)
    expect(result).not.toContain('onclick')
    expect(result).not.toContain('onmouseover')
  })
})