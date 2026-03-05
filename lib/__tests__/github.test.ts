// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'

// github.ts reads env vars as module-level constants, so we must set them
// before the module is evaluated, then force re-evaluation via resetModules.
let createBlogPostPR: (typeof import('@/lib/github'))['createBlogPostPR']

beforeAll(async () => {
  process.env.GITHUB_TOKEN = 'test_token'
  process.env.BLOG_REPO_OWNER = 'test-owner'
  process.env.BLOG_REPO_NAME = 'test-repo'
  process.env.BLOG_CONTENT_PATH = 'content/posts'
  vi.resetModules()
  const mod = await import('@/lib/github')
  createBlogPostPR = mod.createBlogPostPR
})

// Helper to build sequential fetch mocks for the 5 GitHub API calls
function mockGitHubSuccess(prUrl = 'https://github.com/org/repo/pull/1') {
  vi.mocked(fetch)
    .mockResolvedValueOnce(new Response(JSON.stringify({ default_branch: 'main' }), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ object: { sha: 'abc123' } }), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ html_url: prUrl }), { status: 200 }))
}

describe('createBlogPostPR', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => vi.unstubAllGlobals())

  it('returns prUrl and branchName on success', async () => {
    mockGitHubSuccess('https://github.com/org/repo/pull/42')
    const result = await createBlogPostPR({ title: 'Hello World', content: 'Body', scheduledDate: '2026-03-04', status: 'scheduled' })
    expect(result.prUrl).toBe('https://github.com/org/repo/pull/42')
    expect(result.branchName).toBe('resonate/blog-post-2026-03-04-hello-world')
  })

  it('slugifies special characters in title', async () => {
    mockGitHubSuccess()
    const result = await createBlogPostPR({ title: 'My AI & ML Post!', content: 'x', scheduledDate: '2026-03-04', status: 'draft' })
    expect(result.branchName).toContain('my-ai-ml-post')
  })

  it('strips leading/trailing hyphens from slug', async () => {
    mockGitHubSuccess()
    const result = await createBlogPostPR({ title: '---edge---', content: 'x', scheduledDate: '2026-03-04', status: 'draft' })
    expect(result.branchName).toContain('edge')
    expect(result.branchName).not.toMatch(/--/)
  })

  it('uses today\'s date when scheduledDate is empty', async () => {
    mockGitHubSuccess()
    const today = new Date().toISOString().split('T')[0]
    const result = await createBlogPostPR({ title: 'Test', content: 'x', scheduledDate: '', status: 'draft' })
    expect(result.branchName).toContain(today)
  })

  it('sends Authorization header on all requests', async () => {
    mockGitHubSuccess()
    await createBlogPostPR({ title: 'Test', content: 'x', scheduledDate: '2026-03-04', status: 'draft' })
    const calls = vi.mocked(fetch).mock.calls
    calls.forEach(([, opts]) => {
      expect((opts as RequestInit).headers).toMatchObject({ Authorization: 'Bearer test_token' })
    })
  })

  it('encodes file content as base64 with frontmatter', async () => {
    mockGitHubSuccess()
    await createBlogPostPR({ title: 'Test Post', content: 'Body text here', scheduledDate: '2026-03-04', status: 'draft' })
    // 4th fetch call is create-file (PUT)
    const createFileCall = vi.mocked(fetch).mock.calls[3]
    const body = JSON.parse((createFileCall[1] as RequestInit).body as string)
    const decoded = Buffer.from(body.content, 'base64').toString('utf-8')
    expect(decoded).toContain('title: "Test Post"')
    expect(decoded).toContain('Body text here')
  })

  it('throws when repo fetch fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 404 }))
    await expect(createBlogPostPR({ title: 'T', content: 'x', scheduledDate: '2026-03-04', status: 'draft' }))
      .rejects.toThrow('GitHub repo fetch failed')
  })

  it('throws when branch ref fetch fails', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ default_branch: 'main' }), { status: 200 }))
      .mockResolvedValueOnce(new Response('', { status: 404 }))
    await expect(createBlogPostPR({ title: 'T', content: 'x', scheduledDate: '2026-03-04', status: 'draft' }))
      .rejects.toThrow('GitHub branch fetch failed')
  })

  it('throws when create branch fails', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ default_branch: 'main' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ object: { sha: 'abc' } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'already exists' }), { status: 422 }))
    await expect(createBlogPostPR({ title: 'T', content: 'x', scheduledDate: '2026-03-04', status: 'draft' }))
      .rejects.toThrow('GitHub create branch failed')
  })

  it('throws when create file fails', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ default_branch: 'main' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ object: { sha: 'abc' } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'conflict' }), { status: 409 }))
    await expect(createBlogPostPR({ title: 'T', content: 'x', scheduledDate: '2026-03-04', status: 'draft' }))
      .rejects.toThrow('GitHub create file failed')
  })

  it('throws when create PR fails', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ default_branch: 'main' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ object: { sha: 'abc' } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'error' }), { status: 500 }))
    await expect(createBlogPostPR({ title: 'T', content: 'x', scheduledDate: '2026-03-04', status: 'draft' }))
      .rejects.toThrow('GitHub create PR failed')
  })
})
