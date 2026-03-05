// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'

// cortex.ts reads env vars as module-level constants; re-evaluate after setting them.
let streamCortexChat: (typeof import('@/lib/cortex'))['streamCortexChat']
let LINKEDIN_SYSTEM_PROMPT: (typeof import('@/lib/cortex'))['LINKEDIN_SYSTEM_PROMPT']

beforeAll(async () => {
  process.env.CORTEX_API_KEY = 'test_key'
  process.env.CORTEX_BASE_URL = 'https://cortex.test'
  vi.resetModules()
  const mod = await import('@/lib/cortex')
  streamCortexChat = mod.streamCortexChat
  LINKEDIN_SYSTEM_PROMPT = mod.LINKEDIN_SYSTEM_PROMPT
})

describe('streamCortexChat', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => vi.unstubAllGlobals())

  it('returns the response body as a ReadableStream on success', async () => {
    const fakeStream = new ReadableStream()
    vi.mocked(fetch).mockResolvedValueOnce(new Response(fakeStream, { status: 200 }))
    const result = await streamCortexChat([{ role: 'user', content: 'hello' }])
    expect(result).toBeInstanceOf(ReadableStream)
  })

  it('sends LINKEDIN_SYSTEM_PROMPT in the instructions field', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(new ReadableStream(), { status: 200 }))
    await streamCortexChat([{ role: 'user', content: 'test' }])
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)
    expect(body.instructions).toBe(LINKEDIN_SYSTEM_PROMPT)
  })

  it('sends messages in the input field', async () => {
    const messages = [{ role: 'user' as const, content: 'test' }]
    vi.mocked(fetch).mockResolvedValueOnce(new Response(new ReadableStream(), { status: 200 }))
    await streamCortexChat(messages)
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)
    expect(body.input).toEqual(messages)
  })

  it('uses default model "claude-3-5-sonnet" when none provided', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(new ReadableStream(), { status: 200 }))
    await streamCortexChat([{ role: 'user', content: 'test' }])
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)
    expect(body.model).toBe('claude-3-5-sonnet')
  })

  it('forwards custom model argument', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(new ReadableStream(), { status: 200 }))
    await streamCortexChat([{ role: 'user', content: 'test' }], 'claude-opus-4-6')
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)
    expect(body.model).toBe('claude-opus-4-6')
  })

  it('sets stream: true in request body', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(new ReadableStream(), { status: 200 }))
    await streamCortexChat([{ role: 'user', content: 'test' }])
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)
    expect(body.stream).toBe(true)
  })

  it('sends Authorization Bearer header', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(new ReadableStream(), { status: 200 }))
    await streamCortexChat([{ role: 'user', content: 'test' }])
    const headers = vi.mocked(fetch).mock.calls[0][1]!.headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer test_key')
  })

  it('throws on non-200 response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 503 }))
    await expect(streamCortexChat([{ role: 'user', content: 'test' }]))
      .rejects.toThrow('Cortex API error: 503')
  })
})

describe('module initialization', () => {
  it('throws when CORTEX_API_KEY is not set', async () => {
    const saved = process.env.CORTEX_API_KEY
    delete process.env.CORTEX_API_KEY
    vi.resetModules()
    await expect(import('@/lib/cortex')).rejects.toThrow('Missing required environment variable: CORTEX_API_KEY')
    process.env.CORTEX_API_KEY = saved
    vi.resetModules()
  })
})
