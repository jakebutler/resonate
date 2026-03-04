import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useQuery } from 'convex/react'
import Dashboard from '@/app/page'

vi.mock('convex/react', () => ({ useQuery: vi.fn(), useMutation: vi.fn() }))
vi.mock('@/convex/_generated/api', () => ({
  api: { posts: { getStats: 'posts:getStats', list: 'posts:list' } }
}))
vi.mock('@clerk/nextjs', () => ({
  UserButton: () => <div data-testid="user-button" />,
}))
vi.mock('@/components/Calendar/Calendar', () => ({
  Calendar: ({ onCreatePost }: any) => (
    <div data-testid="calendar">
      <button onClick={() => onCreatePost('2026-03-04')}>add-post</button>
    </div>
  ),
}))
vi.mock('@/components/ContentLibrary/ContentLibrary', () => ({
  ContentLibrary: () => <div data-testid="content-library" />,
}))
vi.mock('@/components/CreatePostModal/CreatePostModal', () => ({
  CreatePostModal: ({ open, onSelect }: any) =>
    open ? (
      <div data-testid="create-post-modal">
        <button onClick={() => onSelect('blog')}>blog</button>
        <button onClick={() => onSelect('linkedin')}>linkedin</button>
      </div>
    ) : null,
}))
vi.mock('@/components/BlogPostEditor/BlogPostEditor', () => ({
  BlogPostEditor: ({ open, onClose }: any) =>
    open ? <div data-testid="blog-editor"><button onClick={onClose}>close-blog</button></div> : null,
}))
vi.mock('@/components/LinkedInPostEditor/LinkedInPostEditor', () => ({
  LinkedInPostEditor: ({ open, onClose }: any) =>
    open ? <div data-testid="linkedin-editor"><button onClick={onClose}>close-linkedin</button></div> : null,
}))
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

// stats uses scheduledCount and draftsCount (not scheduled/drafts)
const mockStats = { blogCount: 5, linkedinCount: 3, scheduledCount: 4, draftsCount: 2 }

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useQuery)
      .mockReturnValueOnce(mockStats as any) // getStats
      .mockReturnValueOnce([] as any)         // list
  })

  it('renders stats cards with correct counts', () => {
    render(<Dashboard />)
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows Calendar by default', () => {
    render(<Dashboard />)
    expect(screen.getByTestId('calendar')).toBeInTheDocument()
    expect(screen.queryByTestId('content-library')).not.toBeInTheDocument()
  })

  it('switches to Library view when Library tab clicked', () => {
    render(<Dashboard />)
    fireEvent.click(screen.getByText('Library'))
    expect(screen.getByTestId('content-library')).toBeInTheDocument()
    expect(screen.queryByTestId('calendar')).not.toBeInTheDocument()
  })

  it('opens CreatePostModal when calendar add-post is clicked', () => {
    render(<Dashboard />)
    fireEvent.click(screen.getByText('add-post'))
    expect(screen.getByTestId('create-post-modal')).toBeInTheDocument()
  })

  it('opens BlogPostEditor when blog is selected in modal', () => {
    render(<Dashboard />)
    fireEvent.click(screen.getByText('add-post'))
    fireEvent.click(screen.getByText('blog'))
    expect(screen.getByTestId('blog-editor')).toBeInTheDocument()
  })

  it('opens LinkedInPostEditor when linkedin is selected in modal', () => {
    render(<Dashboard />)
    fireEvent.click(screen.getByText('add-post'))
    fireEvent.click(screen.getByText('linkedin'))
    expect(screen.getByTestId('linkedin-editor')).toBeInTheDocument()
  })

  it('renders UserButton in header', () => {
    render(<Dashboard />)
    expect(screen.getByTestId('user-button')).toBeInTheDocument()
  })
})
