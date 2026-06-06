import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

describe('HeroCyclingHeading', () => {
  it('renders the static words "I build" and "and share what I learn."', async () => {
    const { HeroCyclingHeading } = await import('./hero-cycling-heading')
    const { container } = render(<HeroCyclingHeading />)
    // BEFORE: ['I', 'build'], AFTER: ['and', 'share', 'what', 'I', 'learn.']
    expect(screen.getByText('build')).toBeInTheDocument()
    expect(screen.getByText('and')).toBeInTheDocument()
    expect(screen.getByText('share')).toBeInTheDocument()
    // Multiple 'I' elements are expected (one in BEFORE, one in AFTER)
    const iSpans = container.querySelectorAll('.text-on-surface')
    const iTexts = Array.from(iSpans).filter((s) => s.textContent === 'I')
    expect(iTexts.length).toBeGreaterThanOrEqual(1)
  })

  it('renders the initial cycling word "software"', async () => {
    const { HeroCyclingHeading } = await import('./hero-cycling-heading')
    render(<HeroCyclingHeading />)
    expect(screen.getByText('software')).toBeInTheDocument()
  })

  it('cycles to next word on click', async () => {
    const { HeroCyclingHeading } = await import('./hero-cycling-heading')
    render(<HeroCyclingHeading />)

    const wrapper = screen.getByText('software').closest('.cursor-pointer')!
    fireEvent.click(wrapper)

    await vi.waitFor(
      () => {
        expect(screen.getByText('websites')).toBeInTheDocument()
      },
      { timeout: 500 }
    )
  })

  it('calls onWordChange with the new word after click', async () => {
    const { HeroCyclingHeading } = await import('./hero-cycling-heading')
    const onWordChange = vi.fn()
    render(<HeroCyclingHeading onWordChange={onWordChange} />)

    const wrapper = screen.getByText('software').closest('.cursor-pointer')!
    fireEvent.click(wrapper)

    await vi.waitFor(
      () => {
        expect(onWordChange).toHaveBeenCalledWith('websites')
      },
      { timeout: 500 }
    )
  })

  it('handles hover state (mouse enter and leave) without error', async () => {
    const { HeroCyclingHeading } = await import('./hero-cycling-heading')
    const { container } = render(<HeroCyclingHeading />)
    const wrapper = container.querySelector('.cursor-pointer')!
    expect(() => {
      fireEvent.mouseEnter(wrapper)
      fireEvent.mouseLeave(wrapper)
    }).not.toThrow()
  })

  it('handles mouse move for background position', async () => {
    const { HeroCyclingHeading } = await import('./hero-cycling-heading')
    const { container } = render(<HeroCyclingHeading />)
    const wrapper = container.querySelector('.cursor-pointer')!
    expect(() => fireEvent.mouseMove(wrapper, { clientX: 100, clientY: 20 })).not.toThrow()
  })

  it('syncs to external word prop', async () => {
    const { HeroCyclingHeading } = await import('./hero-cycling-heading')
    const { rerender } = render(<HeroCyclingHeading word="software" />)
    expect(screen.getByText('software')).toBeInTheDocument()

    rerender(<HeroCyclingHeading word="APIs" />)

    await vi.waitFor(
      () => {
        expect(screen.getByText('APIs')).toBeInTheDocument()
      },
      { timeout: 500 }
    )
  })

  it('ignores unknown external word values', async () => {
    const { HeroCyclingHeading } = await import('./hero-cycling-heading')
    render(<HeroCyclingHeading word="unknownword" />)
    // Falls back to default index 0 word
    expect(screen.getByText('software')).toBeInTheDocument()
  })
})
