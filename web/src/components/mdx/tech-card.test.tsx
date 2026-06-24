import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('TechCard', () => {
  it('renders title and children', async () => {
    const { TechCard } = await import('./tech-card')
    render(
      <TechCard logo="/logo.png" title="React" href="https://react.dev">
        A JavaScript library for building UIs
      </TechCard>
    )
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('A JavaScript library for building UIs')).toBeInTheDocument()
  })

  it('renders logo image with alt text', async () => {
    const { TechCard } = await import('./tech-card')
    render(
      <TechCard logo="/logo.png" title="React" href="https://react.dev">
        Content
      </TechCard>
    )
    expect(screen.getByAltText('React logo')).toBeInTheDocument()
  })

  it('renders both links with correct href and target', async () => {
    const { TechCard } = await import('./tech-card')
    render(
      <TechCard logo="/logo.png" title="React" href="https://react.dev">
        Content
      </TechCard>
    )
    const links = screen.getAllByRole('link')
    expect(links.length).toBe(2)
    links.forEach((link) => {
      expect(link.getAttribute('href')).toBe('https://react.dev')
      expect(link.getAttribute('target')).toBe('_blank')
      expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    })
  })
})
