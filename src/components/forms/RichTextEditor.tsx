'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Typography from '@tiptap/extension-typography'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { useCallback, useEffect } from 'react'
import { validateTipTapContent, sanitizeHtml } from '@/lib/security/sanitize'
import { Text } from '@/components/ui/text'

interface RichTextEditorProps {
  content: object | null
  onChange: (content: object, html: string) => void
  placeholder?: string
  maxCharacters?: number
  editable?: boolean
  className?: string
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start writing your journal entry...',
  maxCharacters = 10000,
  editable = true,
  className = ''
}: RichTextEditorProps): React.JSX.Element {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable potentially dangerous extensions
        codeBlock: {
          HTMLAttributes: {
            class: 'hljs'
          }
        },
        // Allow only safe formatting
        bold: {},
        italic: {},
        strike: {},
        code: {}
      }),
      Typography,
      Placeholder.configure({
        placeholder
      }),
      CharacterCount.configure({
        limit: maxCharacters
      })
    ],
    content: content || {
      type: 'doc',
      content: [
        {
          type: 'paragraph'
        }
      ]
    },
    editable,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      
      // Validate content structure
      if (!validateTipTapContent(json)) {
        return
      }

      const html = sanitizeHtml(editor.getHTML())
      onChange(json, html)
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4 ${className}`,
        'data-testid': 'rich-text-editor'
      },
      // Security: Prevent paste of dangerous content
      transformPastedHTML: (html: string) => {
        return sanitizeHtml(html)
      }
    },
    immediatelyRender: false
  })

  // Update content when prop changes
  useEffect(() => {
    if (editor && content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
      if (validateTipTapContent(content)) {
        editor.commands.setContent(content)
      }
    }
  }, [content, editor])

  const handleFormatting = useCallback((command: string, event?: React.MouseEvent) => {
    event?.preventDefault()
    event?.stopPropagation()
    
    if (!editor) return

    switch (command) {
      case 'bold':
        editor.chain().focus().toggleBold().run()
        break
      case 'italic':
        editor.chain().focus().toggleItalic().run()
        break
      case 'strike':
        editor.chain().focus().toggleStrike().run()
        break
      case 'code':
        editor.chain().focus().toggleCode().run()
        break
      case 'paragraph':
        editor.chain().focus().setParagraph().run()
        break
      case 'heading1':
        editor.chain().focus().toggleHeading({ level: 1 }).run()
        break
      case 'heading2':
        editor.chain().focus().toggleHeading({ level: 2 }).run()
        break
      case 'heading3':
        editor.chain().focus().toggleHeading({ level: 3 }).run()
        break
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run()
        break
      case 'orderedList':
        editor.chain().focus().toggleOrderedList().run()
        break
      case 'blockquote':
        editor.chain().focus().toggleBlockquote().run()
        break
      case 'undo':
        editor.chain().focus().undo().run()
        break
      case 'redo':
        editor.chain().focus().redo().run()
        break
    }
  }, [editor])

  if (!editor) {
    return <div className='min-h-[200px] bg-muted animate-pulse rounded-md'></div>
  }

  const characterCount = editor.storage.characterCount.characters()
  const wordCount = editor.storage.characterCount.words()

  return (
    <div className='border border-border rounded-lg overflow-hidden'>
      {editable && (
        <div className='border-b border-border bg-muted px-3 py-2'>
          <div className='flex flex-wrap gap-1'>
            <button
              type='button'
              onClick={(e) => handleFormatting('bold', e)}
              className={`px-2 py-1 text-sm rounded hover:bg-accent ${
                editor.isActive('bold') ? 'bg-accent font-bold' : ''
              }`}
            >
              B
            </button>
            <button
              type='button'
              onClick={(e) => handleFormatting('italic', e)}
              className={`px-2 py-1 text-sm rounded hover:bg-accent ${
                editor.isActive('italic') ? 'bg-accent italic' : ''
              }`}
            >
              I
            </button>
            <button
              type='button'
              onClick={(e) => handleFormatting('strike', e)}
              className={`px-2 py-1 text-sm rounded hover:bg-accent ${
                editor.isActive('strike') ? 'bg-accent line-through' : ''
              }`}
            >
              S
            </button>
            <button
              type='button'
              onClick={(e) => handleFormatting('code', e)}
              className={`px-2 py-1 text-sm rounded hover:bg-accent font-mono ${
                editor.isActive('code') ? 'bg-accent' : ''
              }`}
            >
              &lt;&gt;
            </button>
            
            <div className='w-px h-6 bg-border mx-1'></div>
            
            <button
              type='button'
              onClick={(e) => handleFormatting('heading1', e)}
              className={`px-2 py-1 text-sm rounded hover:bg-accent font-bold ${
                editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''
              }`}
            >
              H1
            </button>
            <button
              type='button'
              onClick={(e) => handleFormatting('heading2', e)}
              className={`px-2 py-1 text-sm rounded hover:bg-accent font-bold ${
                editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''
              }`}
            >
              H2
            </button>
            <button
              type='button'
              onClick={(e) => handleFormatting('heading3', e)}
              className={`px-2 py-1 text-sm rounded hover:bg-accent font-bold ${
                editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''
              }`}
            >
              H3
            </button>
            
            <div className='w-px h-6 bg-border mx-1'></div>
            
            <button
              type='button'
              onClick={(e) => handleFormatting('bulletList', e)}
              className={`px-2 py-1 text-sm rounded hover:bg-accent ${
                editor.isActive('bulletList') ? 'bg-accent' : ''
              }`}
            >
              •
            </button>
            <button
              type='button'
              onClick={(e) => handleFormatting('orderedList', e)}
              className={`px-2 py-1 text-sm rounded hover:bg-accent ${
                editor.isActive('orderedList') ? 'bg-accent' : ''
              }`}
            >
              1.
            </button>
            <button
              type='button'
              onClick={(e) => handleFormatting('blockquote', e)}
              className={`px-2 py-1 text-sm rounded hover:bg-accent ${
                editor.isActive('blockquote') ? 'bg-accent' : ''
              }`}
            >
              &ldquo;&rdquo;
            </button>
            
            <div className='w-px h-6 bg-border mx-1'></div>
            
            <button
              type='button'
              onClick={(e) => handleFormatting('undo', e)}
              className='px-2 py-1 text-sm rounded hover:bg-accent'
              disabled={!editor.can().undo()}
            >
              ↶
            </button>
            <button
              type='button'
              onClick={(e) => handleFormatting('redo', e)}
              className='px-2 py-1 text-sm rounded hover:bg-accent'
              disabled={!editor.can().redo()}
            >
              ↷
            </button>
          </div>
        </div>
      )}
      
      <EditorContent 
        editor={editor}
        className='min-h-[200px] focus-within:ring-2 focus-within:ring-primary'
      />
      
      <div className='border-t border-border bg-muted px-3 py-2 flex justify-between'>
        <Text size="xs" variant="muted">
          {wordCount} words, {characterCount} characters
        </Text>
        {maxCharacters && (
          <Text size="xs" variant={characterCount > maxCharacters ? 'destructive' : 'muted'}>
            {characterCount}/{maxCharacters}
          </Text>
        )}
      </div>
    </div>
  )
}