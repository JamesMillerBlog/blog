import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('lucide-react', () => ({
  CheckCircleIcon: vi.fn((props: Record<string, unknown>) => (
    <svg data-testid="icon-check-circle" {...props} />
  )),
  XCircleIcon: vi.fn((props: Record<string, unknown>) => (
    <svg data-testid="icon-x-circle" {...props} />
  )),
}))

describe('ProsCons', () => {
  it('renders pros and cons lists with default labels', async () => {
    const { ProsCons } = await import('./pros-cons')
    render(<ProsCons pros={['Fast', 'Reliable']} cons={['Expensive', 'Complex']} />)
    expect(screen.getByText('Pros')).toBeInTheDocument()
    expect(screen.getByText('Cons')).toBeInTheDocument()
    expect(screen.getByText('Fast')).toBeInTheDocument()
    expect(screen.getByText('Expensive')).toBeInTheDocument()
  })

  it('renders custom labels when provided', async () => {
    const { ProsCons } = await import('./pros-cons')
    render(
      <ProsCons pros={['Good']} cons={['Bad']} prosLabel="Advantages" consLabel="Disadvantages" />
    )
    expect(screen.getByText('Advantages')).toBeInTheDocument()
    expect(screen.getByText('Disadvantages')).toBeInTheDocument()
  })

  it('renders icons for both columns', async () => {
    const { ProsCons } = await import('./pros-cons')
    render(<ProsCons pros={['A']} cons={['B']} />)
    expect(screen.getByTestId('icon-check-circle')).toBeInTheDocument()
    expect(screen.getByTestId('icon-x-circle')).toBeInTheDocument()
  })

  it('renders empty lists without error', async () => {
    const { ProsCons } = await import('./pros-cons')
    const { container } = render(<ProsCons pros={[]} cons={[]} />)
    expect(container.querySelector('ul')).toBeInTheDocument()
  })
})
