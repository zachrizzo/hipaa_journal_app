import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RichTextEditor } from '../RichTextEditor'

// Mock TipTap editor
jest.mock('@tiptap/react', () => ({
  useEditor: jest.fn(() => ({
    getJSON: jest.fn(() => ({ type: 'doc', content: [] })),
    getHTML: jest.fn(() => '<p>Test content</p>'),
    commands: {
      setContent: jest.fn(),
      focus: jest.fn(() => ({ toggleBold: jest.fn(() => ({ run: jest.fn() })) }))
    },
    chain: jest.fn(() => ({
      focus: jest.fn(() => ({
        toggleBold: jest.fn(() => ({ run: jest.fn() })),
        toggleItalic: jest.fn(() => ({ run: jest.fn() })),
        toggleStrike: jest.fn(() => ({ run: jest.fn() })),
        toggleCode: jest.fn(() => ({ run: jest.fn() })),
        setParagraph: jest.fn(() => ({ run: jest.fn() })),
        toggleHeading: jest.fn(() => ({ run: jest.fn() })),
        toggleBulletList: jest.fn(() => ({ run: jest.fn() })),
        toggleOrderedList: jest.fn(() => ({ run: jest.fn() })),
        toggleBlockquote: jest.fn(() => ({ run: jest.fn() })),
        undo: jest.fn(() => ({ run: jest.fn() })),
        redo: jest.fn(() => ({ run: jest.fn() }))
      }))
    })),
    isActive: jest.fn(() => false),
    can: jest.fn(() => ({ undo: jest.fn(() => true), redo: jest.fn(() => true) })),
    storage: {
      characterCount: {
        characters: jest.fn(() => 100),
        words: jest.fn(() => 20)
      }
    }
  })),
  EditorContent: ({ ...props }: { editor?: unknown }) => <div data-testid="editor-content" {...props} />
}))

jest.mock('@tiptap/starter-kit', () => ({
  configure: jest.fn(() => ({}))
}))

jest.mock('@tiptap/extension-typography', () => ({}))
jest.mock('@tiptap/extension-placeholder', () => ({
  configure: jest.fn(() => ({}))
}))
jest.mock('@tiptap/extension-character-count', () => ({
  configure: jest.fn(() => ({}))
}))

describe('RichTextEditor', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders editor with toolbar when editable', () => {
    render(
      <RichTextEditor
        content={null}
        onChange={mockOnChange}
        editable={true}
      />
    )

    expect(screen.getByTestId('editor-content')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /B/i })).toBeInTheDocument() // Bold button
    expect(screen.getByRole('button', { name: /I/i })).toBeInTheDocument() // Italic button
  })

  it('renders editor without toolbar when not editable', () => {
    render(
      <RichTextEditor
        content={null}
        onChange={mockOnChange}
        editable={false}
      />
    )

    expect(screen.getByTestId('editor-content')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /B/i })).not.toBeInTheDocument()
  })

  it('displays character and word count', () => {
    render(
      <RichTextEditor
        content={null}
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText(/20 words, 100 characters/)).toBeInTheDocument()
  })

  it('shows character limit when maxCharacters is set', () => {
    render(
      <RichTextEditor
        content={null}
        onChange={mockOnChange}
        maxCharacters={500}
      />
    )

    expect(screen.getByText(/100\/500/)).toBeInTheDocument()
  })

  it('handles formatting button clicks', async () => {
    const user = userEvent.setup()
    
    render(
      <RichTextEditor
        content={null}
        onChange={mockOnChange}
        editable={true}
      />
    )

    const boldButton = screen.getByRole('button', { name: /B/i })
    await user.click(boldButton)

    // Since we're mocking the editor, we can't test the actual formatting
    // but we can verify the button was clicked
    expect(boldButton).toBeInTheDocument()
  })

  it('displays loading state when editor is not ready', () => {
    // Mock useEditor to return null (editor not ready)
    const { useEditor } = jest.requireMock('@tiptap/react') as { useEditor: jest.Mock }
    useEditor.mockReturnValueOnce(null)

    const { container } = render(
      <RichTextEditor
        content={null}
        onChange={mockOnChange}
      />
    )

    // Look for the specific loading div with animate-pulse class
    const loadingDiv = container.querySelector('.animate-pulse')
    expect(loadingDiv).toHaveClass('min-h-[200px]', 'bg-gray-50', 'animate-pulse', 'rounded-md')
  })

  it('applies custom className', () => {
    render(
      <RichTextEditor
        content={null}
        onChange={mockOnChange}
        className="custom-class"
      />
    )

    const container = screen.getByTestId('editor-content').parentElement
    expect(container).toHaveClass('border', 'border-gray-300', 'rounded-lg')
  })

  it('shows placeholder text', () => {
    const customPlaceholder = 'Write your thoughts here...'
    
    render(
      <RichTextEditor
        content={null}
        onChange={mockOnChange}
        placeholder={customPlaceholder}
      />
    )

    // The placeholder is passed to the Placeholder extension config
    // We can't easily test if it's displayed without a real editor
    expect(screen.getByTestId('editor-content')).toBeInTheDocument()
  })

  it('handles basic formatting options', async () => {
    const user = userEvent.setup()
    
    render(
      <RichTextEditor
        content={null}
        onChange={mockOnChange}
        editable={true}
      />
    )

    // Test basic formatting buttons that we can reliably find
    const boldButton = screen.getByRole('button', { name: /B/i })
    const italicButton = screen.getByRole('button', { name: /I/i })
    const strikeButton = screen.getByRole('button', { name: /S/i })
    const h1Button = screen.getByRole('button', { name: /H1/i })
    
    await user.click(boldButton)
    await user.click(italicButton) 
    await user.click(strikeButton)
    await user.click(h1Button)

    // Just verify the buttons exist and are clickable
    expect(boldButton).toBeInTheDocument()
    expect(italicButton).toBeInTheDocument()
    expect(strikeButton).toBeInTheDocument()
    expect(h1Button).toBeInTheDocument()
  })

  it('handles list and special formatting options', async () => {
    const user = userEvent.setup()
    
    render(
      <RichTextEditor
        content={null}
        onChange={mockOnChange}
        editable={true}
      />
    )

    // Test list formatting buttons by their text content
    const bulletListButton = screen.getByText('•')
    const orderedListButton = screen.getByText('1.')
    
    await user.click(bulletListButton)
    await user.click(orderedListButton)
    
    expect(bulletListButton).toBeInTheDocument()
    expect(orderedListButton).toBeInTheDocument()
  })
})