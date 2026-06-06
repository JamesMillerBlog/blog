import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

describe('CyclingDescription', () => {
  it('renders the static description text', async () => {
    const { CyclingDescription } = await import('./cycling-description')
    render(<CyclingDescription />)
    expect(screen.getByText(/Over a decade of products and experiences/)).toBeInTheDocument()
  })

  it('renders "from" and "to" connective words', async () => {
    const { CyclingDescription } = await import('./cycling-description')
    const { container } = render(<CyclingDescription />)
    expect(container.textContent).toContain('from')
    expect(container.textContent).toContain('to')
  })

  it('renders the initial "from" word (web apps)', async () => {
    const { CyclingDescription } = await import('./cycling-description')
    render(<CyclingDescription />)
    expect(screen.getByText('web apps')).toBeInTheDocument()
  })

  it('renders the initial "to" word (computer vision)', async () => {
    const { CyclingDescription } = await import('./cycling-description')
    render(<CyclingDescription />)
    expect(screen.getByText('computer vision')).toBeInTheDocument()
  })

  it('cycles "from" word on click and calls onCategorySelect', async () => {
    const { CyclingDescription } = await import('./cycling-description')
    const onCategorySelect = vi.fn()
    render(<CyclingDescription onCategorySelect={onCategorySelect} />)

    const fromWord = screen.getByText('web apps')
    fireEvent.click(fromWord)

    await vi.waitFor(
      () => {
        expect(onCategorySelect).toHaveBeenCalled()
      },
      { timeout: 500 }
    )
  })

  it('cycles "to" word on click and calls onCategorySelect', async () => {
    const { CyclingDescription } = await import('./cycling-description')
    const onCategorySelect = vi.fn()
    render(<CyclingDescription onCategorySelect={onCategorySelect} />)

    const toWord = screen.getByText('computer vision')
    fireEvent.click(toWord)

    await vi.waitFor(
      () => {
        expect(onCategorySelect).toHaveBeenCalled()
      },
      { timeout: 500 }
    )
  })

  it('works without onCategorySelect prop', async () => {
    const { CyclingDescription } = await import('./cycling-description')
    render(<CyclingDescription />)
    const fromWord = screen.getByText('web apps')
    expect(() => fireEvent.click(fromWord)).not.toThrow()
  })

  it('renders cycling words with cursor-pointer style', async () => {
    const { CyclingDescription } = await import('./cycling-description')
    const { container } = render(<CyclingDescription />)
    const clickableSpans = container.querySelectorAll('.cursor-pointer')
    expect(clickableSpans.length).toBe(2)
  })

  it('handles mouse enter and leave on cycling words', async () => {
    const { CyclingDescription } = await import('./cycling-description')
    const { container } = render(<CyclingDescription />)
    const clickableSpan = container.querySelector('.cursor-pointer')!
    expect(() => {
      fireEvent.mouseEnter(clickableSpan)
      fireEvent.mouseLeave(clickableSpan)
    }).not.toThrow()
  })

  it('handles mouse move on cycling words', async () => {
    const { CyclingDescription } = await import('./cycling-description')
    const { container } = render(<CyclingDescription />)
    const clickableSpan = container.querySelector('.cursor-pointer')!
    expect(() => fireEvent.mouseMove(clickableSpan, { clientX: 50, clientY: 10 })).not.toThrow()
  })

  it('changes from word after click animation completes', async () => {
    const { CyclingDescription } = await import('./cycling-description')
    render(<CyclingDescription />)

    const fromWord = screen.getByText('web apps')
    fireEvent.click(fromWord)

    await vi.waitFor(
      () => {
        // web apps should be replaced by a different word
        expect(screen.queryByText('web apps')).toBeNull()
      },
      { timeout: 500 }
    )
  })
})
