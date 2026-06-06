import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

vi.mock('@/components/ui/hero-cycling-heading', () => ({
  HeroCyclingHeading: ({
    onWordChange,
    word,
  }: {
    onWordChange?: (w: string) => void
    word?: string
  }) => (
    <div data-testid="hero-cycling-heading">
      <span data-testid="current-word">{word ?? 'software'}</span>
      <button data-testid="cycle-btn" onClick={() => onWordChange?.('websites')}>
        Cycle
      </button>
    </div>
  ),
}))

describe('HeroSection', () => {
  it('renders the section element', async () => {
    const { HeroSection } = await import('./hero-section')
    const { container } = render(<HeroSection />)
    expect(container.querySelector('section')).not.toBeNull()
  })

  it('renders h1 with the cycling heading', async () => {
    const { HeroSection } = await import('./hero-section')
    const { container } = render(<HeroSection />)
    expect(container.querySelector('h1')).not.toBeNull()
    expect(screen.getByTestId('hero-cycling-heading')).toBeInTheDocument()
  })

  it('passes word prop to HeroCyclingHeading', async () => {
    const { HeroSection } = await import('./hero-section')
    render(<HeroSection word="agents" />)
    expect(screen.getByTestId('current-word').textContent).toBe('agents')
  })

  it('calls onWordChange when heading cycles', async () => {
    const { HeroSection } = await import('./hero-section')
    const onWordChange = vi.fn()
    render(<HeroSection onWordChange={onWordChange} />)
    fireEvent.click(screen.getByTestId('cycle-btn'))
    expect(onWordChange).toHaveBeenCalledWith('websites')
  })

  it('renders without onWordChange or word props', async () => {
    const { HeroSection } = await import('./hero-section')
    expect(() => render(<HeroSection />)).not.toThrow()
  })
})
