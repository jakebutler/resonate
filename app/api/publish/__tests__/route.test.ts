import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_123' }),
}))

vi.mock('@/lib/github', () => ({
  createBlogPostPR: vi.fn().mockResolvedValue({
    prUrl: 'https://github.com/org/repo/pull/1',
    branchName: 'resonate/blog-post-2026-03-04-test',
  }),
}))

import { POST } from '@/app/api/publish/route'
import { auth } from '@clerk/nextjs/server'
import { createBlogPostPR } from '@/lib/github'

function makeRequest(body: object) {
  return new Request('http://localhost/api/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/publish', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as any)
    const res = await POST(makeRequest({ title: 'T', content: 'C' }) as any)
    expect(res.status).toBe(401)
  })

  it('returns 400 when title is missing', async () => {
    const res = await POST(makeRequest({ content: 'Body' }) as any)
    expect(res.status).toBe(400)
  })

  it('returns 400 when content is missing', async () => {
    const res = await POST(makeRequest({ title: 'Title' }) as any)
    expect(res.status).toBe(400)
  })

  it('returns 200 with prUrl and branchName on success', async () => {
    const res = await POST(makeRequest({ title: 'Hello', content: 'World', scheduledDate: '2026-03-04', status: 'scheduled' }) as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.prUrl).toBe('https://github.com/org/repo/pull/1')
    expect(data.branchName).toBeDefined()
  })

  it('calls createBlogPostPR with correct params', async () => {
    await POST(makeRequest({ title: 'My Post', content: 'Content here', scheduledDate: '2026-05-01', status: 'scheduled' }) as any)
    expect(createBlogPostPR).toHaveBeenCalledWith({
      title: 'My Post',
      content: 'Content here',
      scheduledDate: '2026-05-01',
      status: 'scheduled',
    })
  })

  it('returns 500 when createBlogPostPR throws', async () => {
    vi.mocked(createBlogPostPR).mockRejectedValueOnce(new Error('GitHub API down'))
    const res = await POST(makeRequest({ title: 'T', content: 'C' }) as any)
    expect(res.status).toBe(500)
  })
})
