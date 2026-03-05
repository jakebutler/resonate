import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handler = vi.fn()
    render(<Button onClick={handler}>Go</Button>)
    fireEvent.click(screen.getByText('Go'))
    expect(handler).toHaveBeenCalledOnce()
  })

  it('does not call onClick when disabled', () => {
    const handler = vi.fn()
    render(<Button disabled onClick={handler}>Go</Button>)
    fireEvent.click(screen.getByText('Go'))
    expect(handler).not.toHaveBeenCalled()
  })

  it('has disabled attribute when disabled prop set', () => {
    render(<Button disabled>Go</Button>)
    expect(screen.getByText('Go').closest('button')).toBeDisabled()
  })

  it('applies primary variant classes', () => {
    render(<Button variant="primary">Go</Button>)
    const btn = screen.getByText('Go').closest('button')!
    expect(btn.className).toContain('ff7d00')
  })

  it('applies danger variant classes', () => {
    render(<Button variant="danger">Del</Button>)
    const btn = screen.getByText('Del').closest('button')!
    expect(btn.className).toMatch(/red|danger|78290f/)
  })

  it('forwards type attribute', () => {
    render(<Button type="submit">Submit</Button>)
    expect(screen.getByText('Submit').closest('button')).toHaveAttribute('type', 'submit')
  })
})
