import '@testing-library/jest-dom'

// Mock browser APIs not available in jsdom
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
  writable: true,
})

vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
vi.stubGlobal('alert', vi.fn())
