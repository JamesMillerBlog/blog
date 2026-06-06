import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

describe('CyclingHeadlineWord', () => {
  it('renders the default word "Made"', async () => {
    const { CyclingHeadlineWord } = await import('./cycling-headline-word')
    render(<CyclingHeadlineWord />)
    expect(screen.getByText('Made')).toBeInTheDocument()
  })

  it('cycles to the next word on click', async () => {
    const { CyclingHeadlineWord } = await import('./cycling-headline-word')
    render(<CyclingHeadlineWord />)

    const span = screen.getByText('Made')
    fireEvent.click(span)

    await vi.waitFor(
      () => {
        expect(screen.getByText('Built')).toBeInTheDocument()
      },
      { timeout: 500 }
    )
  })

  it('calls onWordChange with the new word after click', async () => {
    const { CyclingHeadlineWord } = await import('./cycling-headline-word')
    const onWordChange = vi.fn()
    render(<CyclingHeadlineWord onWordChange={onWordChange} />)

    fireEvent.click(screen.getByText('Made'))

    await vi.waitFor(
      () => {
        expect(onWordChange).toHaveBeenCalledWith('Built')
      },
      { timeout: 500 }
    )
  })

  it('applies hover state on mouse enter', async () => {
    const { CyclingHeadlineWord } = await import('./cycling-headline-word')
    const { container } = render(<CyclingHeadlineWord />)
    const span = container.querySelector('span')!
    expect(() => fireEvent.mouseEnter(span)).not.toThrow()
  })

  it('resets hover state on mouse leave', async () => {
    const { CyclingHeadlineWord } = await import('./cycling-headline-word')
    const { container } = render(<CyclingHeadlineWord />)
    const span = container.querySelector('span')!
    fireEvent.mouseEnter(span)
    expect(() => fireEvent.mouseLeave(span)).not.toThrow()
  })

  it('updates mouse position on mouse move', async () => {
    const { CyclingHeadlineWord } = await import('./cycling-headline-word')
    const { container } = render(<CyclingHeadlineWord />)
    const span = container.querySelector('span')!
    expect(() => fireEvent.mouseMove(span, { clientX: 50, clientY: 10 })).not.toThrow()
  })

  it('accepts an external word prop and syncs to it', async () => {
    const { CyclingHeadlineWord } = await import('./cycling-headline-word')
    const { rerender } = render(<CyclingHeadlineWord word="Made" />)
    expect(screen.getByText('Made')).toBeInTheDocument()

    rerender(<CyclingHeadlineWord word="Built" />)

    await vi.waitFor(
      () => {
        expect(screen.getByText('Built')).toBeInTheDocument()
      },
      { timeout: 500 }
    )
  })

  it('ignores unknown external word values', async () => {
    const { CyclingHeadlineWord } = await import('./cycling-headline-word')
    render(<CyclingHeadlineWord word="UnknownWord" />)
    // Unknown word is not in variants, so "Made" (index 0) stays
    expect(screen.getByText('Made')).toBeInTheDocument()
  })

  it('renders with italic and cursor-pointer styles', async () => {
    const { CyclingHeadlineWord } = await import('./cycling-headline-word')
    const { container } = render(<CyclingHeadlineWord />)
    const span = container.querySelector('span')!
    expect(span.className).toContain('italic')
    expect(span.className).toContain('cursor-pointer')
  })
})
