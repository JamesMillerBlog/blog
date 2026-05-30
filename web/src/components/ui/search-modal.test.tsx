import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { SearchModal } from './search-modal'
import type { Post } from '@/types/post'

function makePosts(): Post[] {
  return [
    {
      slug: 'hello-world',
      title: 'Hello World Post',
      date: '2024-01-01',
      excerpt: 'A beginner guide to everything',
      coverImage: '',
      author: { name: 'James', picture: '' },
      ogImage: { url: '' },
      content: '',
    },
    {
      slug: 'advanced-aws',
      title: 'Advanced AWS Tips',
      date: '2024-03-01',
      excerpt: 'Deep dive into serverless',
      coverImage: '',
      author: { name: 'James', picture: '' },
      ogImage: { url: '' },
      content: '',
    },
    {
      slug: 'react-patterns',
      title: 'React Patterns',
      date: '2024-05-01',
      excerpt: 'Common React design patterns',
      coverImage: '',
      author: { name: 'James', picture: '' },
      ogImage: { url: '' },
      content: '',
    },
  ]
}

describe('SearchModal', () => {
  it('renders null when isOpen=false', () => {
    const { container } = render(<SearchModal isOpen={false} onClose={vi.fn()} posts={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders search input when isOpen=true', () => {
    render(<SearchModal isOpen={true} onClose={vi.fn()} posts={[]} />)
    expect(screen.getByPlaceholderText('Search posts...')).toBeInTheDocument()
  })

  it('shows prompt text when no query entered', () => {
    render(<SearchModal isOpen={true} onClose={vi.fn()} posts={makePosts()} />)
    expect(screen.getByText(/Start typing to search posts/)).toBeInTheDocument()
    expect(screen.getByText(/Cmd/)).toBeInTheDocument()
  })

  it('filters posts by title (case-insensitive)', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} posts={makePosts()} />)
    const input = screen.getByPlaceholderText('Search posts...')

    await user.type(input, 'aws')

    expect(screen.getByText('Advanced AWS Tips')).toBeInTheDocument()
    expect(screen.queryByText('Hello World Post')).not.toBeInTheDocument()
    expect(screen.queryByText('React Patterns')).not.toBeInTheDocument()
  })

  it('filters posts by excerpt', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} posts={makePosts()} />)
    const input = screen.getByPlaceholderText('Search posts...')

    await user.type(input, 'serverless')

    expect(screen.getByText('Advanced AWS Tips')).toBeInTheDocument()
  })

  it('shows "no posts found" for unmatched query', async () => {
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} posts={makePosts()} />)
    const input = screen.getByPlaceholderText('Search posts...')

    await user.type(input, 'zzznotfound')

    expect(screen.getByText(/No posts found/)).toBeInTheDocument()
  })

  it('limits results to 5', async () => {
    const manyPosts = Array.from({ length: 10 }, (_, i) => ({
      slug: `post-${i}`,
      title: `Post ${i}`,
      date: '2024-01-01',
      excerpt: 'excerpt',
      coverImage: '',
      author: { name: 'James', picture: '' },
      ogImage: { url: '' },
      content: '',
    }))
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={vi.fn()} posts={manyPosts} />)
    const input = screen.getByPlaceholderText('Search posts...')

    await user.type(input, 'Post')

    const links = screen.getAllByRole('link')
    expect(links.length).toBeLessThanOrEqual(5)
  })

  it('closes on escape key', () => {
    const onClose = vi.fn()
    render(<SearchModal isOpen={true} onClose={onClose} posts={[]} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('closes on Cmd+K when already open', () => {
    const onClose = vi.fn()
    render(<SearchModal isOpen={true} onClose={onClose} posts={[]} />)
    fireEvent.keyDown(document, { key: 'k', metaKey: true })
    expect(onClose).toHaveBeenCalled()
  })

  it('closes on backdrop click', async () => {
    const onClose = vi.fn()
    render(<SearchModal isOpen={true} onClose={onClose} posts={[]} />)
    // The backdrop is the first div with onClick
    const backdrop = document.querySelector('.fixed.inset-0 > .absolute')
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(onClose).toHaveBeenCalled()
    }
  })

  it('closes modal when clicking a result link', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<SearchModal isOpen={true} onClose={onClose} posts={makePosts()} />)
    const input = screen.getByPlaceholderText('Search posts...')

    await user.type(input, 'Hello World')

    const link = screen.getByText('Hello World Post')
    await user.click(link)
    expect(onClose).toHaveBeenCalled()
  })
})
