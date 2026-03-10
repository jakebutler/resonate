import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useQuery, useMutation } from 'convex/react'
import { BlogPostEditor } from '@/components/BlogPostEditor/BlogPostEditor'

vi.mock('convex/react', () => ({ useQuery: vi.fn(), useMutation: vi.fn() }))
vi.mock('@/components/AIAssistant/AIAssistant', () => ({
  AIAssistant: ({ onUsePost }: { onUsePost: (text: string) => void }) => (
    <button onClick={() => onUsePost('# Draft from AI')}>use-blog-ai</button>
  ),
}))
vi.mock('@/convex/_generated/api', () => ({
  api: {
    posts: {
      getById: 'posts:getById',
      create: 'posts:create',
      update: 'posts:update',
      remove: 'posts:remove',
      generateUploadUrl: 'posts:generateUploadUrl',
    }
  }
}))

describe('BlogPostEditor', () => {
  const mockCreate = vi.fn().mockResolvedValue('new_id')
  const mockUpdate = vi.fn().mockResolvedValue(undefined)
  const mockRemove = vi.fn().mockResolvedValue(undefined)
  const mockGenerateUploadUrl = vi.fn().mockResolvedValue('https://upload.url')

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
    vi.mocked(useQuery).mockReturnValue(undefined)
    vi.mocked(useMutation).mockImplementation((fn) => {
      const key = String(fn)
      if (key.includes('create')) return mockCreate
      if (key.includes('update')) return mockUpdate
      if (key.includes('remove')) return mockRemove
      if (key.includes('generateUploadUrl')) return mockGenerateUploadUrl
      return vi.fn()
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('does not render when open is false', () => {
    render(<BlogPostEditor open={false} onClose={vi.fn()} onSaved={vi.fn()} postId={null} />)
    expect(screen.queryByText(/blog post/i)).not.toBeInTheDocument()
  })

  it('shows New Blog Post title for new post', () => {
    render(<BlogPostEditor open={true} onClose={vi.fn()} onSaved={vi.fn()} postId={null} />)
    expect(screen.getByText(/new blog post/i)).toBeInTheDocument()
  })

  it('switches between Write and Preview tabs', async () => {
    render(<BlogPostEditor open={true} onClose={vi.fn()} onSaved={vi.fn()} postId={null} />)
    const previewTab = screen.getByText('Preview')
    fireEvent.click(previewTab)
    // Textarea should be gone after switching to preview
    expect(screen.queryByPlaceholderText(/write your blog post/i)).not.toBeInTheDocument()
  })

  it('fills content from AI Assistant and switches back to write mode', async () => {
    render(<BlogPostEditor open={true} onClose={vi.fn()} onSaved={vi.fn()} postId={null} />)
    fireEvent.click(screen.getByText('AI Assistant'))
    fireEvent.click(screen.getByText('use-blog-ai'))

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/write your blog post/i) as HTMLTextAreaElement
      expect(textarea.value).toBe('# Draft from AI')
    })
  })

  it('calls createPost with draft status when Save Draft clicked', async () => {
    render(<BlogPostEditor open={true} onClose={vi.fn()} onSaved={vi.fn()} postId={null} />)
    await userEvent.type(screen.getByPlaceholderText(/compelling title/i), 'My Post')
    await userEvent.type(screen.getByPlaceholderText(/write your blog post/i), 'Some content')
    fireEvent.click(screen.getByText('Save Draft'))
    await waitFor(() => expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'draft', type: 'blog' })
    ))
  })

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn()
    render(<BlogPostEditor open={true} onClose={onClose} onSaved={vi.fn()} postId={null} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
