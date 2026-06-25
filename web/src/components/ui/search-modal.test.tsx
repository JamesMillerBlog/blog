import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchModal } from './search-modal'
import type { SearchItem } from '@/types/search'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

const makeItems = (): SearchItem[] => {
  return [
    {
      type: 'post',
      slug: 'hello-world',
      title: 'Hello World Post',
      description: 'A beginner guide to everything',
      tags: ['beginner'],
      url: '/posts/hello-world/',
      dateOrYear: '2024-01-01',
    },
    {
      type: 'post',
      slug: 'advanced-aws',
      title: 'Advanced AWS Tips',
      description: 'Deep dive into serverless',
      tags: ['aws', 'serverless'],
      url: '/posts/advanced-aws/',
      dateOrYear: '2024-03-01',
    },
    {
      type: 'post',
      slug: 'react-patterns',
      title: 'React Patterns',
      description: 'Common React design patterns',
      tags: ['react'],
      url: '/posts/react-patterns/',
      dateOrYear: '2024-05-01',
    },
    {
      type: 'project',
      slug: 'momentum-vxi',
      title: 'Momentum VXi',
      description: 'A virtual experience platform',
      tags: ['WebXR', 'Three.js'],
      url: '/projects/#momentum-vxi',
      dateOrYear: 2020,
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
    expect(screen.getByText(/Start typing to search posts and projects/)).toBeInTheDocument()
    expect(screen.getByText(/Cmd/)).toBeInTheDocument()
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

  it('shows no results for unmatched query', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} items={makeItems()} />)
    const input = screen.getByPlaceholderText('Search posts and projects...')

    await user.type(input, 'zzznotfound')

    expect(screen.getByText(/No results found/)).toBeInTheDocument()
  })

  it('limits results to 8', async () => {
    const manyItems = Array.from({ length: 20 }, (_, i) => ({
      type: 'post' as const,
      slug: `post-${i}`,
      title: `Post ${i}`,
      description: 'excerpt',
      tags: [],
      url: `/posts/post-${i}/`,
      dateOrYear: '2024-01-01',
    }))
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} items={manyItems} />)
    const input = screen.getByPlaceholderText('Search posts and projects...')

    await user.type(input, 'Post')

    const buttons = screen.getAllByRole('button')
    // Filter only result buttons (not the ESC kbd etc)
    const resultButtons = buttons.filter(
      (b) => b.textContent?.includes('Post') && b.textContent?.includes('excerpt')
    )
    expect(resultButtons.length).toBeLessThanOrEqual(8)
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

  it('shows post and project type badges', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} items={makeItems()} />)
    const input = screen.getByPlaceholderText('Search posts and projects...')

    await user.type(input, 'momentum')

    expect(screen.getByText('Momentum VXi')).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
  })

  it('closes modal when clicking a result button', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={onClose} items={makeItems()} />)
    const input = screen.getByPlaceholderText('Search posts and projects...')

    await user.type(input, 'Hello World')

    const button = screen.getByText('Hello World Post')
    await user.click(button)
    expect(onClose).toHaveBeenCalled()
  })

  it('highlights first result by default', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} items={makeItems()} />)
    const input = screen.getByPlaceholderText('Search posts and projects...')

    await user.type(input, 'post')

    const buttons = screen.getAllByRole('button').filter((b) => b.textContent?.includes('Post'))
    expect(buttons.length).toBeGreaterThan(0)
    // First button should have active class
    expect(buttons[0].className).toContain('opacity-100')
  })

  it('navigates with ArrowDown and Enter keys', async () => {
    mockPush.mockClear()

    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} items={makeItems()} />)
    const input = screen.getByPlaceholderText('Search posts and projects...')

    await user.type(input, 'aws')

    // First item should be highlighted (activeIndex = 0), press ArrowDown then Enter
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockPush).toHaveBeenCalled()
  })
})
