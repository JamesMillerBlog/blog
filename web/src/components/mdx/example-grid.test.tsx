import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('ExampleGrid', () => {
  it('renders grid with children', async () => {
    const { ExampleGrid } = await import('./example-grid')
    render(
      <ExampleGrid>
        <div data-testid="child">Child</div>
      </ExampleGrid>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})

describe('ExampleCard', () => {
  it('renders card with title and content', async () => {
    const { ExampleCard } = await import('./example-grid')
    render(
      <ExampleCard src="/img.jpg" alt="Example" title="My Example">
        Description text
      </ExampleCard>
    )
    expect(screen.getByText('My Example')).toBeInTheDocument()
    expect(screen.getByText('Description text')).toBeInTheDocument()
    expect(screen.getByAltText('Example')).toBeInTheDocument()
  })

  it('renders card title as link when href provided', async () => {
    const { ExampleCard } = await import('./example-grid')
    render(
      <ExampleCard src="/img.jpg" alt="Clickable" title="Link Card" href="https://example.com">
        Content
      </ExampleCard>
    )
    const link = screen.getByText('Link Card')
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('href')).toBe('https://example.com')
  })

  it('renders card title as paragraph when no href', async () => {
    const { ExampleCard } = await import('./example-grid')
    render(
      <ExampleCard src="/img.jpg" alt="Static" title="Static Card">
        Content
      </ExampleCard>
    )
    const title = screen.getByText('Static Card')
    expect(title.tagName).toBe('P')
  })
})
