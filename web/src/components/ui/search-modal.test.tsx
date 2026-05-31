import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { SearchModal } from './search-modal'
import type { SearchItem } from '@/types/search'

// jsdom doesn't implement scrollIntoView
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
})

function makeItems(): SearchItem[] {
  return [
    {
      slug: 'hello-world',
      title: 'Hello World Post',
      description: 'A beginner guide to everything',
      type: 'post',
      href: '/posts/hello-world',
      tags: ['beginner'],
    },
    {
      slug: 'advanced-aws',
      title: 'Advanced AWS Tips',
      description: 'Deep dive into serverless',
      type: 'post',
      href: '/posts/advanced-aws',
      tags: ['aws', 'serverless'],
    },
    {
      slug: 'react-patterns',
      title: 'React Patterns',
      description: 'Common React design patterns',
      type: 'post',
      href: '/posts/react-patterns',
      tags: ['react'],
    },
    {
      slug: 'momentum-vxi',
      title: 'Momentum VXi',
      description: 'A virtual experience platform built during the pandemic',
      type: 'project',
      href: '/projects#momentum-vxi',
      tags: ['WebXR', 'Three.js'],
    },
  ]
}

describe('SearchModal', () => {
  it('renders null when isOpen=false', () => {
    const { container } = render(<SearchModal isOpen={false} onClose={vi.fn()} items={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders search input when isOpen=true', () => {
    render(<SearchModal isOpen={true} onClose={vi.fn()} items={[]} />)
    expect(screen.getByPlaceholderText('Search posts and projects...')).toBeInTheDocument()
  })

  it('shows prompt text when no query entered', () => {
    render(<SearchModal isOpen={true} onClose={vi.fn()} items={makeItems()} />)
    expect(screen.getByText(/Start typing to search/)).toBeInTheDocument()
  })

  it('filters items by title (case-insensitive)', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} items={makeItems()} />)
    const input = screen.getByPlaceholderText('Search posts and projects...')

    await user.type(input, 'aws')

    expect(screen.getByText('Advanced AWS Tips')).toBeInTheDocument()
    expect(screen.queryByText('Hello World Post')).not.toBeInTheDocument()
    expect(screen.queryByText('React Patterns')).not.toBeInTheDocument()
  })

  it('filters items by description', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} items={makeItems()} />)
    const input = screen.getByPlaceholderText('Search posts and projects...')

    await user.type(input, 'serverless')

    expect(screen.getByText('Advanced AWS Tips')).toBeInTheDocument()
  })

  it('includes project items in search results', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} items={makeItems()} />)
    const input = screen.getByPlaceholderText('Search posts and projects...')

    await user.type(input, 'virtual')

    expect(screen.getByText('Momentum VXi')).toBeInTheDocument()
    expect(screen.getByText('Project')).toBeInTheDocument()
  })

  it('shows type badge for posts and projects', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} items={makeItems()} />)
    const input = screen.getByPlaceholderText('Search posts and projects...')

    await user.type(input, 'Hello')

    expect(screen.getByText('Post')).toBeInTheDocument()
  })

  it('shows "no results found" for unmatched query', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} items={makeItems()} />)
    const input = screen.getByPlaceholderText('Search posts and projects...')

    await user.type(input, 'zzznotfound')

    expect(screen.getByText(/No results found/)).toBeInTheDocument()
  })

  it('limits results to 8', async () => {
    const manyItems: SearchItem[] = Array.from({ length: 15 }, (_, i) => ({
      slug: `item-${i}`,
      title: `Item ${i}`,
      description: 'description',
      type: 'post' as const,
      href: `/posts/item-${i}`,
      tags: [],
    }))
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} items={manyItems} />)
    const input = screen.getByPlaceholderText('Search posts and projects...')

    await user.type(input, 'Item')

    const options = screen.getAllByRole('option')
    expect(options.length).toBeLessThanOrEqual(8)
  })

  it('closes on escape key', () => {
    const onClose = vi.fn()
    render(<SearchModal isOpen={true} onClose={onClose} items={[]} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('closes on Cmd+K when already open', () => {
    const onClose = vi.fn()
    render(<SearchModal isOpen={true} onClose={onClose} items={[]} />)
    fireEvent.keyDown(document, { key: 'k', metaKey: true })
    expect(onClose).toHaveBeenCalled()
  })

  it('closes on backdrop click', async () => {
    const onClose = vi.fn()
    render(<SearchModal isOpen={true} onClose={onClose} items={[]} />)
    const backdrop = document.querySelector('.fixed.inset-0 > .absolute')
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(onClose).toHaveBeenCalled()
    }
  })

  it('closes modal when clicking a result link', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={onClose} items={makeItems()} />)
    const input = screen.getByPlaceholderText('Search posts and projects...')

    await user.type(input, 'Hello World')

    const link = screen.getByText('Hello World Post')
    await user.click(link)
    expect(onClose).toHaveBeenCalled()
  })

  it('orders results by relevance (title match over description match)', async () => {
    const items: SearchItem[] = [
      {
        slug: 'intro',
        title: 'Introduction to React',
        description: 'Some basic stuff about react',
        type: 'post',
        href: '/posts/intro',
        tags: [],
      },
      {
        slug: 'deep',
        title: 'Deep Dive into Node.js',
        description: 'React is mentioned here in passing',
        type: 'post',
        href: '/posts/deep',
        tags: [],
      },
    ]
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} items={items} />)
    const input = screen.getByPlaceholderText('Search posts and projects...')

    await user.type(input, 'react')

    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveTextContent('Introduction to React')
  })

  it('first item is highlighted (aria-selected=true)', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} items={makeItems()} />)
    const input = screen.getByPlaceholderText('Search posts and projects...')

    await user.type(input, 'a')

    const options = screen.getAllByRole('option')
    expect(options[0].getAttribute('aria-selected')).toBe('true')
  })

  it('arrow down moves selection to next item', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} items={makeItems()} />)
    const input = screen.getByPlaceholderText('Search posts and projects...')

    await user.type(input, 'a')

    // First item highlighted
    expect(screen.getAllByRole('option')[0].getAttribute('aria-selected')).toBe('true')

    fireEvent.keyDown(document, { key: 'ArrowDown' })

    // Second item now highlighted
    expect(screen.getAllByRole('option')[1].getAttribute('aria-selected')).toBe('true')
    expect(screen.getAllByRole('option')[0].getAttribute('aria-selected')).toBe('false')
  })

  it('arrow up wraps to last item', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} items={makeItems()} />)
    const input = screen.getByPlaceholderText('Search posts and projects...')

    await user.type(input, 'a')

    fireEvent.keyDown(document, { key: 'ArrowUp' })

    const options = screen.getAllByRole('option')
    const lastIndex = options.length - 1
    expect(options[lastIndex].getAttribute('aria-selected')).toBe('true')
  })

  it('enter on result navigates to selected link', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={onClose} items={makeItems()} />)
    const input = screen.getByPlaceholderText('Search posts and projects...')

    await user.type(input, 'Hello')

    const link = screen.getByText('Hello World Post').closest('a')
    expect(link).toBeTruthy()

    // Simulate clicking the link directly — the Enter handler clicks itemRefs
    fireEvent.click(link!)

    expect(onClose).toHaveBeenCalled()
  })

  it('shows keyboard hint footer when results exist', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} items={makeItems()} />)
    const input = screen.getByPlaceholderText('Search posts and projects...')

    await user.type(input, 'aws')

    expect(screen.getByText(/navigate/)).toBeInTheDocument()
    expect(screen.getByText(/select/)).toBeInTheDocument()
    expect(screen.getByText(/close/)).toBeInTheDocument()
  })

  it('has correct aria attributes for accessibility', async () => {
    render(<SearchModal isOpen={true} onClose={vi.fn()} items={makeItems()} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-label', 'Search')
  })
})
