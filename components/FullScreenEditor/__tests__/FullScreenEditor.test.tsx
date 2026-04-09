import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useQuery, useMutation } from 'convex/react'
import { FullScreenEditor } from '@/components/FullScreenEditor/FullScreenEditor'

// ── Convex ──────────────────────────────────────────────────────────────────
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}))

vi.mock('@/convex/_generated/api', () => ({
  api: {
    posts: {
      getById: 'posts:getById',
      create: 'posts:create',
      update: 'posts:update',
    },
  },
}))

// ── Next.js navigation ───────────────────────────────────────────────────────
const mockPush = vi.fn()
const mockReplace = vi.fn()
const mockBack = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
  useSearchParams: () => ({ get: () => null }),
}))

// ── TiptapEditor — mock the whole component so ProseMirror doesn't run in jsdom ──
vi.mock('@/components/TiptapEditor/TiptapEditor', () => ({
  TiptapEditor: vi.fn(
    ({ onChange, placeholder }: { onChange?: (html: string) => void; placeholder?: string }) => (
      <div
        data-testid="tiptap-editor"
        contentEditable
        suppressContentEditableWarning
        placeholder={placeholder}
        onInput={(e) => onChange?.((e.target as HTMLElement).innerHTML)}
      >
        <p>Editor content area</p>
      </div>
    )
  ),
}))

describe('FullScreenEditor', () => {
  const mockCreate = vi.fn().mockResolvedValue('new-post-id')
  const mockUpdate = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    window.HTMLElement.prototype.scrollIntoView = vi.fn()

    vi.mocked(useMutation).mockImplementation((fn: unknown) => {
      const key = fn as string
      if (key === 'posts:create') return mockCreate
      if (key === 'posts:update') return mockUpdate
      return vi.fn()
    })

    // Default: no existing post (new post mode)
    vi.mocked(useQuery).mockReturnValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  // ── BEHAVIOR 1: renders the core UI ──────────────────────────────────────
  it('renders a large title field with placeholder "Untitled post"', () => {
    render(<FullScreenEditor postId="new" />)
    const titleInput = screen.getByPlaceholderText(/untitled post/i)
    expect(titleInput).toBeInTheDocument()
  })

  it('renders a back navigation button', () => {
    render(<FullScreenEditor postId="new" />)
    const backBtn = screen.getByRole('button', { name: /back/i })
    expect(backBtn).toBeInTheDocument()
  })

  it('renders the Tiptap editor area', () => {
    render(<FullScreenEditor postId="new" />)
    expect(screen.getByTestId('tiptap-editor')).toBeInTheDocument()
  })

  it('renders a save status indicator', () => {
    render(<FullScreenEditor postId="new" />)
    // Initially shows "Saved" or similar status
    expect(screen.getByTestId('save-status')).toBeInTheDocument()
  })

  // ── BEHAVIOR 2: back navigation ──────────────────────────────────────────
  it('calls router.back() when back button is clicked', () => {
    render(<FullScreenEditor postId="new" />)
    const backBtn = screen.getByRole('button', { name: /back/i })
    fireEvent.click(backBtn)
    expect(mockBack).toHaveBeenCalled()
  })

  // ── BEHAVIOR 3: auto-save creates a new post on first change ────────────
  it('creates a new post after debounce when title changes', async () => {
    render(<FullScreenEditor postId="new" />)

    const titleInput = screen.getByPlaceholderText(/untitled post/i)
    fireEvent.change(titleInput, { target: { value: 'My New Post' } })

    // Before debounce fires, create should not be called
    expect(mockCreate).not.toHaveBeenCalled()

    // Advance past the 3s debounce
    await act(async () => {
      vi.advanceTimersByTime(3100)
    })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'blog',
        title: 'My New Post',
      })
    )
  })

  it('shows "Saving..." while auto-save is in flight', async () => {
    // Make create hang so we can observe the "Saving..." state
    let resolveSave!: () => void
    mockCreate.mockReturnValue(
      new Promise<string>((resolve) => {
        resolveSave = () => resolve('new-post-id')
      })
    )

    render(<FullScreenEditor postId="new" />)
    fireEvent.change(screen.getByPlaceholderText(/untitled post/i), {
      target: { value: 'Draft title' },
    })

    await act(async () => {
      vi.advanceTimersByTime(3100)
    })

    expect(screen.getByTestId('save-status')).toHaveTextContent(/saving/i)

    // Resolve and confirm it goes back to "Saved"
    await act(async () => {
      resolveSave()
    })

    expect(screen.getByTestId('save-status')).toHaveTextContent(/saved/i)
  })

  // ── BEHAVIOR 4: loads existing post ─────────────────────────────────────
  it('pre-fills title when an existing post is loaded', () => {
    vi.mocked(useQuery).mockReturnValue({
      _id: 'post-123',
      type: 'blog',
      title: 'Existing Post Title',
      content: '<p>Existing content</p>',
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    render(<FullScreenEditor postId="post-123" />)

    expect(screen.getByDisplayValue('Existing Post Title')).toBeInTheDocument()
  })

  it('updates an existing post (not creates) when editing', async () => {
    vi.mocked(useQuery).mockReturnValue({
      _id: 'post-123',
      type: 'blog',
      title: 'Existing Post Title',
      content: '<p>Existing content</p>',
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    render(<FullScreenEditor postId="post-123" />)

    fireEvent.change(screen.getByDisplayValue('Existing Post Title'), {
      target: { value: 'Updated Title' },
    })

    await act(async () => {
      vi.advanceTimersByTime(3100)
    })

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'post-123',
        title: 'Updated Title',
      })
    )
    expect(mockCreate).not.toHaveBeenCalled()
  })
})
