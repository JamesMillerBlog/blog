import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('lucide-react', () => ({
  Info: vi.fn((props: Record<string, unknown>) => <svg data-testid="icon-info" {...props} />),
  Lightbulb: vi.fn((props: Record<string, unknown>) => (
    <svg data-testid="icon-lightbulb" {...props} />
  )),
  AlertTriangle: vi.fn((props: Record<string, unknown>) => (
    <svg data-testid="icon-alert" {...props} />
  )),
  StickyNote: vi.fn((props: Record<string, unknown>) => <svg data-testid="icon-note" {...props} />),
}))

describe('Callout', () => {
  it('renders children content', async () => {
    const { Callout } = await import('./callout')
    render(<Callout>This is a note</Callout>)
    expect(screen.getByText('This is a note')).toBeInTheDocument()
  })

  it('defaults to "note" type when no type specified', async () => {
    const { Callout } = await import('./callout')
    render(<Callout>Content</Callout>)
    expect(screen.getByRole('note')).toHaveAttribute('aria-label', 'Note')
  })

  it('renders info type correctly', async () => {
    const { Callout } = await import('./callout')
    render(<Callout type="info">Info content</Callout>)
    expect(screen.getByRole('note')).toHaveAttribute('aria-label', 'Info')
  })

  it('renders warning type correctly', async () => {
    const { Callout } = await import('./callout')
    render(<Callout type="warning">Warning content</Callout>)
    expect(screen.getByRole('note')).toHaveAttribute('aria-label', 'Warning')
  })

  it('renders tip type correctly', async () => {
    const { Callout } = await import('./callout')
    render(<Callout type="tip">Tip content</Callout>)
    expect(screen.getByRole('note')).toHaveAttribute('aria-label', 'Tip')
  })

  it('renders border-l-4 class for visual distinction', async () => {
    const { Callout } = await import('./callout')
    render(<Callout type="info">Test</Callout>)
    const note = screen.getByRole('note')
    expect(note.className).toContain('border-l-4')
  })
})
