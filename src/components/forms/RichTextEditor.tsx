'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Typography from '@tiptap/extension-typography'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { useCallback, useEffect } from 'react'
import { validateTipTapContent, sanitizeHtml } from '@/lib/security/sanitize'

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
        console.warn('Invalid content structure detected')
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

  const handleFormatting = useCallback((command: string) => {
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
    return <div className='min-h-[200px] bg-gray-50 animate-pulse rounded-md'></div>
  }

  const characterCount = editor.storage.characterCount.characters()
  const wordCount = editor.storage.characterCount.words()

  return (
    <div className='border border-gray-300 rounded-lg overflow-hidden'>
      {editable && (
        <div className='border-b border-gray-200 bg-gray-50 px-3 py-2'>
          <div className='flex flex-wrap gap-1'>
            <button
              type='button'
              onClick={() => handleFormatting('bold')}
              className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
                editor.isActive('bold') ? 'bg-gray-200 font-bold' : ''
              }`}
            >
              B
            </button>
            <button
              type='button'
              onClick={() => handleFormatting('italic')}
              className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
                editor.isActive('italic') ? 'bg-gray-200 italic' : ''
              }`}
            >
              I
            </button>
            <button
              type='button'
              onClick={() => handleFormatting('strike')}
              className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
                editor.isActive('strike') ? 'bg-gray-200 line-through' : ''
              }`}
            >
              S
            </button>
            <button
              type='button'
              onClick={() => handleFormatting('code')}
              className={`px-2 py-1 text-sm rounded hover:bg-gray-200 font-mono ${
                editor.isActive('code') ? 'bg-gray-200' : ''
              }`}
            >
              &lt;&gt;
            </button>
            
            <div className='w-px h-6 bg-gray-300 mx-1'></div>
            
            <button
              type='button'
              onClick={() => handleFormatting('heading1')}
              className={`px-2 py-1 text-sm rounded hover:bg-gray-200 font-bold ${
                editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''
              }`}
            >
              H1
            </button>
            <button
              type='button'
              onClick={() => handleFormatting('heading2')}
              className={`px-2 py-1 text-sm rounded hover:bg-gray-200 font-bold ${
                editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''
              }`}
            >
              H2
            </button>
            <button
              type='button'
              onClick={() => handleFormatting('heading3')}
              className={`px-2 py-1 text-sm rounded hover:bg-gray-200 font-bold ${
                editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''
              }`}
            >
              H3
            </button>
            
            <div className='w-px h-6 bg-gray-300 mx-1'></div>
            
            <button
              type='button'
              onClick={() => handleFormatting('bulletList')}
              className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
                editor.isActive('bulletList') ? 'bg-gray-200' : ''
              }`}
            >
              •
            </button>
            <button
              type='button'
              onClick={() => handleFormatting('orderedList')}
              className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
                editor.isActive('orderedList') ? 'bg-gray-200' : ''
              }`}
            >
              1.
            </button>
            <button
              type='button'
              onClick={() => handleFormatting('blockquote')}
              className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
                editor.isActive('blockquote') ? 'bg-gray-200' : ''
              }`}
            >
              &ldquo;&rdquo;
            </button>
            
            <div className='w-px h-6 bg-gray-300 mx-1'></div>
            
            <button
              type='button'
              onClick={() => handleFormatting('undo')}
              className='px-2 py-1 text-sm rounded hover:bg-gray-200'
              disabled={!editor.can().undo()}
            >
              ↶
            </button>
            <button
              type='button'
              onClick={() => handleFormatting('redo')}
              className='px-2 py-1 text-sm rounded hover:bg-gray-200'
              disabled={!editor.can().redo()}
            >
              ↷
            </button>
          </div>
        </div>
      )}
      
      <EditorContent 
        editor={editor}
        className='min-h-[200px] focus-within:ring-2 focus-within:ring-blue-500'
      />
      
      <div className='border-t border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500 flex justify-between'>
        <span>
          {wordCount} words, {characterCount} characters
        </span>
        {maxCharacters && (
          <span className={characterCount > maxCharacters ? 'text-red-500' : ''}>
            {characterCount}/{maxCharacters}
          </span>
        )}
      </div>
    </div>
  )
}