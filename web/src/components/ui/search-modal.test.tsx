import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchModal } from './search-modal'
import type { SearchItem } from '@/types/search'

// jsdom doesn't implement scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

function makeSearchItems(): SearchItem[] {
  return [
    {
      type: 'post',
      slug: 'hello-world',
      href: '/posts/hello-world',
      title: 'Hello World Post',
      description: 'A beginner guide to everything',
      tags: ['beginner'],
      dateOrYear: '2024-01-01',
    },
    {
      type: 'post',
      slug: 'advanced-aws',
      href: '/posts/advanced-aws',
      title: 'Advanced AWS Tips',
      description: 'Deep dive into serverless',
      tags: ['aws', 'serverless'],
      dateOrYear: '2024-03-01',
    },
    {
      type: 'post',
      slug: 'react-patterns',
      href: '/posts/react-patterns',
      title: 'React Patterns',
      description: 'Common React design patterns',
      tags: ['react', 'frontend'],
      dateOrYear: '2024-05-01',
    },
    {
      type: 'project',
      slug: 'momentum-vxi',
      href: '/projects#momentum-vxi',
      title: 'Momentum VXi',
      description: 'A virtual experience platform for WebXR',
      tags: ['WebXR', 'Three.js', 'React'],
      dateOrYear: 2020,
    },
  ]
}

function makeMultiReactItems(): SearchItem[] {
  return [
    {
      type: 'post',
      slug: 'a',
      href: '/posts/a',
      title: 'Alpha React Post',
      description: 'Some description',
      tags: ['react'],
      dateOrYear: '2024-01-01',
    },
    {
      type: 'post',
      slug: 'b',
      href: '/posts/b',
      title: 'Beta React Guide',
      description: 'Another description',
      tags: ['react'],
      dateOrYear: '2024-02-01',
    },
    {
      type: 'project',
      slug: 'c',
      href: '/projects#c',
      title: 'Gamma Project',
      description: 'React project',
      tags: ['react'],
      dateOrYear: 2020,
    },
  ]
}

describe('SearchModal', () => {
  it('renders null when isOpen=false', () => {
    const { container } = render(<SearchModal isOpen={false} onClose={vi.fn()} searchItems={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders search input when isOpen=true', () => {
    render(<SearchModal isOpen={true} onClose={vi.fn()} searchItems={[]} />)
    expect(screen.getByPlaceholderText('Search posts & projects...')).toBeInTheDocument()
  })

  it('shows prompt text when no query entered', () => {
    render(<SearchModal isOpen={true} onClose={vi.fn()} searchItems={makeSearchItems()} />)
    expect(screen.getByText(/Start typing to search posts/)).toBeInTheDocument()
    expect(screen.getByText(/Cmd/)).toBeInTheDocument()
  })

  it('filters items by title (case-insensitive)', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} searchItems={makeSearchItems()} />)
    const input = screen.getByPlaceholderText('Search posts & projects...')

    await user.type(input, 'aws')

    expect(screen.getByText('Advanced AWS Tips')).toBeInTheDocument()
    expect(screen.queryByText('Hello World Post')).not.toBeInTheDocument()
    expect(screen.queryByText('React Patterns')).not.toBeInTheDocument()
  })

  it('filters items by description', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} searchItems={makeSearchItems()} />)
    const input = screen.getByPlaceholderText('Search posts & projects...')

    await user.type(input, 'serverless')

    expect(screen.getByText('Advanced AWS Tips')).toBeInTheDocument()
  })

  it('includes projects in results', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} searchItems={makeSearchItems()} />)
    const input = screen.getByPlaceholderText('Search posts & projects...')

    await user.type(input, 'momentum')

    expect(screen.getByText('Momentum VXi')).toBeInTheDocument()
  })

  it('shows type badge (post/project) on results', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} searchItems={makeSearchItems()} />)
    const input = screen.getByPlaceholderText('Search posts & projects...')

    await user.type(input, 'momentum')

    expect(screen.getByText('project')).toBeInTheDocument()
  })

  it('shows "no results found" for unmatched query', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} searchItems={makeSearchItems()} />)
    const input = screen.getByPlaceholderText('Search posts & projects...')

    await user.type(input, 'zzznotfound')

    expect(screen.getByText(/No results found/)).toBeInTheDocument()
  })

  it('sorts results by relevance — title match before description match', async () => {
    const items: SearchItem[] = [
      {
        type: 'post',
        slug: 'z-desc-only',
        href: '/posts/z',
        title: 'Something',
        description: 'AWS is mentioned here',
        tags: [],
        dateOrYear: '2024-01-01',
      },
      {
        type: 'post',
        slug: 'a-title-match',
        href: '/posts/a',
        title: 'AWS Deep Dive',
        description: 'Some description',
        tags: [],
        dateOrYear: '2024-01-01',
      },
      {
        type: 'post',
        slug: 'b-title-contains',
        href: '/posts/b',
        title: 'Learning AWS Basics',
        description: 'Some description',
        tags: [],
        dateOrYear: '2024-01-01',
      },
    ]
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} searchItems={items} />)
    const input = screen.getByPlaceholderText('Search posts & projects...')

    await user.type(input, 'aws')

    const links = screen.getAllByRole('option')
    // First should be starts-with match (AWS Deep Dive), then contains (Learning AWS Basics), then description-only (Something)
    expect(links[0]).toHaveTextContent('AWS Deep Dive')
    expect(links[1]).toHaveTextContent('Learning AWS Basics')
    expect(links[2]).toHaveTextContent('Something')
  })

  it('highlights first result with activeIndex', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} searchItems={makeSearchItems()} />)
    const input = screen.getByPlaceholderText('Search posts & projects...')

    await user.type(input, 'aws')

    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    expect(options[0]).toHaveAttribute('id', 'result-0')
  })

  it('navigates with ArrowDown key', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} searchItems={makeMultiReactItems()} />)
    const input = screen.getByPlaceholderText('Search posts & projects...')

    await user.type(input, 'react')

    const options = screen.getAllByRole('option')
    expect(options.length).toBeGreaterThanOrEqual(3)

    // ArrowDown to second item
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(options[1]).toHaveAttribute('aria-selected', 'true')
  })

  it('navigates with ArrowUp key', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} searchItems={makeMultiReactItems()} />)
    const input = screen.getByPlaceholderText('Search posts & projects...')

    await user.type(input, 'react')

    // ArrowDown then ArrowUp
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowUp' })

    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('does not go below first item with ArrowUp', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} searchItems={makeMultiReactItems()} />)
    const input = screen.getByPlaceholderText('Search posts & projects...')

    await user.type(input, 'react')

    fireEvent.keyDown(input, { key: 'ArrowUp' })
    fireEvent.keyDown(input, { key: 'ArrowUp' })

    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('updates activeIndex on hover', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} searchItems={makeMultiReactItems()} />)
    const input = screen.getByPlaceholderText('Search posts & projects...')

    await user.type(input, 'react')

    const options = screen.getAllByRole('option')
    await user.hover(options[1])

    expect(options[1]).toHaveAttribute('aria-selected', 'true')
    expect(options[0]).toHaveAttribute('aria-selected', 'false')
  })

  it('closes on escape key', () => {
    const onClose = vi.fn()
    render(<SearchModal isOpen={true} onClose={onClose} searchItems={[]} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('closes on Cmd+K when already open', () => {
    const onClose = vi.fn()
    render(<SearchModal isOpen={true} onClose={onClose} searchItems={[]} />)
    fireEvent.keyDown(document, { key: 'k', metaKey: true })
    expect(onClose).toHaveBeenCalled()
  })

  it('closes on backdrop click', () => {
    const onClose = vi.fn()
    render(<SearchModal isOpen={true} onClose={onClose} searchItems={[]} />)
    const backdrop = document.querySelector('.fixed.inset-0 > .absolute')
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(onClose).toHaveBeenCalled()
    }
  })

  it('closes modal when clicking a result link', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={onClose} searchItems={makeSearchItems()} />)
    const input = screen.getByPlaceholderText('Search posts & projects...')

    await user.type(input, 'Hello World')

    const link = screen.getByText('Hello World Post')
    await user.click(link)
    expect(onClose).toHaveBeenCalled()
  })

  it('project result links to /projects#slug', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} searchItems={makeSearchItems()} />)
    const input = screen.getByPlaceholderText('Search posts & projects...')

    await user.type(input, 'momentum')

    const link = screen.getByText('Momentum VXi').closest('a')
    expect(link).toHaveAttribute('href', '/projects#momentum-vxi')
  })

  it('shows tags on result items', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} searchItems={makeSearchItems()} />)
    const input = screen.getByPlaceholderText('Search posts & projects...')

    await user.type(input, 'momentum')

    expect(screen.getByText('WebXR')).toBeInTheDocument()
    expect(screen.getByText('Three.js')).toBeInTheDocument()
  })
})
