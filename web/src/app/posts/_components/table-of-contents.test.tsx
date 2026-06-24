import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

let observeCallback: ((entries: IntersectionObserverEntry[]) => void) | null = null
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()
const mockScrollIntoView = vi.fn()

class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    observeCallback = callback as (entries: IntersectionObserverEntry[]) => void
  }
  observe = mockObserve
  disconnect = mockDisconnect
  unobserve = vi.fn()
  takeRecords = () => []
  root = null
  rootMargin = ''
  thresholds = []
}

window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver

const setupHeadings = (headings: Array<{ tag: string; id?: string; text: string }>): void => {
  const container = document.createElement('div')
  container.className = 'markdown'
  headings.forEach(({ tag, id, text }) => {
    const el = document.createElement(tag)
    if (id) el.id = id
    el.textContent = text
    container.appendChild(el)
  })
  document.body.appendChild(container)
  Element.prototype.scrollIntoView = mockScrollIntoView
}

const cleanupHeadings = (): void => {
  document.querySelector('.markdown')?.remove()
  observeCallback = null
  mockObserve.mockReset()
  mockDisconnect.mockReset()
  mockScrollIntoView.mockReset()
}

const renderAndFlush = async (component: React.ReactElement) => {
  const result = render(component)
  await act(() => vi.advanceTimersByTime(1))
  return result
}

// Helper: get button text when .markdown has duplicate heading elements
const getTocButton = (text: string): HTMLElement => {
  const all = screen.getAllByText(text)
  return all.find((el) => el.tagName === 'BUTTON')!
}

describe('TableOfContents (sidebar)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setupHeadings([
      { tag: 'h2', id: 'intro', text: 'Introduction' },
      { tag: 'h3', id: 'setup', text: 'Setup' },
      { tag: 'h2', id: 'conclusion', text: 'Conclusion' },
    ])
  })

  afterEach(() => {
    vi.useRealTimers()
    cleanupHeadings()
  })

  it('renders "On this page" heading when headings exist', async () => {
    const { TableOfContents } = await import('./table-of-contents')
    await renderAndFlush(<TableOfContents />)
    expect(screen.getByText('On this page')).toBeInTheDocument()
  })

  it('renders all heading titles as buttons', async () => {
    const { TableOfContents } = await import('./table-of-contents')
    await renderAndFlush(<TableOfContents />)
    expect(getTocButton('Introduction')).toBeInTheDocument()
    expect(getTocButton('Setup')).toBeInTheDocument()
    expect(getTocButton('Conclusion')).toBeInTheDocument()
  })

  it('applies pl-3 indentation to h3 level headings', async () => {
    const { TableOfContents } = await import('./table-of-contents')
    await renderAndFlush(<TableOfContents />)
    expect(getTocButton('Setup').className).toContain('pl-3')
  })

  it('does not indent h2 level headings', async () => {
    const { TableOfContents } = await import('./table-of-contents')
    await renderAndFlush(<TableOfContents />)
    expect(getTocButton('Introduction').className).not.toContain('pl-3')
  })

  it('scrolls to heading on button click', async () => {
    const { TableOfContents } = await import('./table-of-contents')
    await renderAndFlush(<TableOfContents />)
    fireEvent.click(getTocButton('Introduction'))
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
  })

  it('returns null when no headings found', async () => {
    cleanupHeadings()
    const { TableOfContents } = await import('./table-of-contents')
    const { container } = render(<TableOfContents />)
    await act(() => vi.advanceTimersByTime(1))
    expect(container.innerHTML).toBe('')
  })

  it('activates heading when intersection observer fires', async () => {
    const { TableOfContents } = await import('./table-of-contents')
    await renderAndFlush(<TableOfContents />)

    const setupEl = document.getElementById('setup')!
    act(() => {
      observeCallback!([
        { target: setupEl, isIntersecting: true } as unknown as IntersectionObserverEntry,
      ])
    })

    expect(getTocButton('Setup').className).toContain('border-l-2')
    expect(getTocButton('Setup').className).toContain('font-bold')
  })

  it('generates id from textContent when heading has no id', async () => {
    cleanupHeadings()
    setupHeadings([
      { tag: 'h2', text: 'Getting Started' },
      { tag: 'h3', text: 'Advanced Topics' },
    ])
    const { TableOfContents } = await import('./table-of-contents')
    await renderAndFlush(<TableOfContents />)
    expect(getTocButton('Getting Started')).toBeInTheDocument()
    expect(getTocButton('Advanced Topics')).toBeInTheDocument()
    expect(document.getElementById('getting-started')).not.toBeNull()
    expect(document.getElementById('advanced-topics')).not.toBeNull()
  })

  it('slugify removes special characters', async () => {
    cleanupHeadings()
    setupHeadings([{ tag: 'h2', text: 'What is AWS Lambda?' }])
    const { TableOfContents } = await import('./table-of-contents')
    await renderAndFlush(<TableOfContents />)
    expect(document.getElementById('what-is-aws-lambda')).not.toBeNull()
  })

  it('renders sticky nav element', async () => {
    const { TableOfContents } = await import('./table-of-contents')
    await renderAndFlush(<TableOfContents />)
    expect(document.querySelector('nav.sticky')).not.toBeNull()
  })

  it('applies pl-6 indentation to h4 level headings', async () => {
    cleanupHeadings()
    setupHeadings([
      { tag: 'h2', id: 'intro', text: 'Introduction' },
      { tag: 'h4', id: 'deep', text: 'Deep Detail' },
    ])
    const { TableOfContents } = await import('./table-of-contents')
    await renderAndFlush(<TableOfContents />)
    expect(getTocButton('Deep Detail').className).toContain('pl-6')
  })

  it('highlights active heading in sidebar when intersection fires', async () => {
    const { TableOfContents } = await import('./table-of-contents')
    await renderAndFlush(<TableOfContents />)

    const introEl = document.getElementById('intro')!
    act(() => {
      observeCallback!([
        { target: introEl, isIntersecting: true } as unknown as IntersectionObserverEntry,
      ])
    })

    expect(getTocButton('Introduction').className).toContain('border-primary')
  })
})

describe('InlineTableOfContents (mobile)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setupHeadings([
      { tag: 'h2', id: 'intro', text: 'Introduction' },
      { tag: 'h3', id: 'details', text: 'Details' },
    ])
  })

  afterEach(() => {
    vi.useRealTimers()
    cleanupHeadings()
  })

  it('renders collapsed by default with "On this page" header', async () => {
    const { InlineTableOfContents } = await import('./table-of-contents')
    await renderAndFlush(<InlineTableOfContents />)
    expect(screen.getByText('On this page')).toBeInTheDocument()
    // The TOC list is collapsed, but .markdown headings still in DOM
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('expands to show headings on header click', async () => {
    const { InlineTableOfContents } = await import('./table-of-contents')
    await renderAndFlush(<InlineTableOfContents />)

    act(() => {
      fireEvent.click(screen.getByText('On this page').closest('button')!)
    })

    expect(getTocButton('Introduction')).toBeInTheDocument()
    expect(getTocButton('Details')).toBeInTheDocument()
  })

  it('collapses headings on second header click', async () => {
    const { InlineTableOfContents } = await import('./table-of-contents')
    await renderAndFlush(<InlineTableOfContents />)

    const toggleBtn = screen.getByText('On this page').closest('button')!
    act(() => fireEvent.click(toggleBtn))
    expect(getTocButton('Introduction')).toBeInTheDocument()

    act(() => fireEvent.click(toggleBtn))
    // After collapse, only .markdown headings remain, no buttons
    const buttons = screen
      .queryAllByRole('button')
      .filter((b) => b.textContent === 'Introduction' || b.textContent === 'Details')
    expect(buttons).toHaveLength(0)
  })

  it('closes dropdown after clicking a heading link', async () => {
    const { InlineTableOfContents } = await import('./table-of-contents')
    await renderAndFlush(<InlineTableOfContents />)

    act(() => fireEvent.click(screen.getByText('On this page').closest('button')!))
    expect(getTocButton('Introduction')).toBeInTheDocument()

    act(() => fireEvent.click(getTocButton('Introduction')))

    // After clicking a heading, the list collapses
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(mockScrollIntoView).toHaveBeenCalled()
  })

  it('returns null when no headings found', async () => {
    cleanupHeadings()
    const { InlineTableOfContents } = await import('./table-of-contents')
    const { container } = render(<InlineTableOfContents />)
    await act(() => vi.advanceTimersByTime(1))
    expect(container.innerHTML).toBe('')
  })

  it('renders chevron SVG that rotates when open', async () => {
    const { InlineTableOfContents } = await import('./table-of-contents')
    await renderAndFlush(<InlineTableOfContents />)

    const toggleBtn = screen.getByText('On this page').closest('button')!
    const svg = toggleBtn.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg!.getAttribute('class')).not.toContain('rotate-180')

    act(() => fireEvent.click(toggleBtn))
    expect(svg!.getAttribute('class')).toContain('rotate-180')
  })

  it('cleans up observer and timeout on unmount', async () => {
    const { InlineTableOfContents } = await import('./table-of-contents')
    const { unmount } = render(<InlineTableOfContents />)
    await act(() => vi.advanceTimersByTime(1))
    unmount()
    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('applies pl-8 indentation to h4 headings in inline TOC', async () => {
    cleanupHeadings()
    setupHeadings([
      { tag: 'h2', id: 'intro', text: 'Introduction' },
      { tag: 'h4', id: 'deep', text: 'Deep Detail' },
    ])
    const { InlineTableOfContents } = await import('./table-of-contents')
    await renderAndFlush(<InlineTableOfContents />)

    act(() => fireEvent.click(screen.getByText('On this page').closest('button')!))
    expect(getTocButton('Deep Detail').className).toContain('pl-8')
  })

  it('highlights active heading in inline TOC when intersection fires', async () => {
    const { InlineTableOfContents } = await import('./table-of-contents')
    await renderAndFlush(<InlineTableOfContents />)

    const introEl = document.getElementById('intro')!
    act(() => {
      observeCallback!([
        { target: introEl, isIntersecting: true } as unknown as IntersectionObserverEntry,
      ])
    })

    act(() => fireEvent.click(screen.getByText('On this page').closest('button')!))
    expect(getTocButton('Introduction').className).toContain('font-bold')
    expect(getTocButton('Introduction').className).toContain('text-primary')
  })
})
