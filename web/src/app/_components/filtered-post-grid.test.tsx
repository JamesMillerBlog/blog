import { describe, it, expect, vi } from 'vitest'

// Mock framer-motion to avoid animation issues in jsdom
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    section: 'section',
    span: 'span',
    nav: 'nav',
    button: 'button',
    ul: 'ul',
    li: 'li',
    article: 'article',
    h3: 'h3',
    p: 'p',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
  useSpring: (v: unknown) => v,
}))

import React from 'react'
import { render, screen } from '@testing-library/react'
import type { Post } from '@/types/post'

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    slug: 'test-post',
    title: 'Test Post',
    date: '2024-01-15',
    coverImage: '/cover.jpg',
    author: { name: 'James', picture: '/pic.jpg' },
    excerpt: 'Test excerpt',
    ogImage: { url: '/og.jpg' },
    content: 'Some content here',
    tags: ['react', 'aws'],
    ...overrides,
  }
}

describe('FilteredPostGrid', () => {
  it('renders posts for "Everything" tag', async () => {
    // Mock next/navigation
    vi.doMock('next/navigation', () => ({
      useRouter: () => ({
        replace: vi.fn(),
      }),
      useSearchParams: () => new URLSearchParams(),
    }))

    const { FilteredPostGrid } = await import('@/app/_components/filtered-post-grid')
    const posts = [makePost({ slug: 'post-1', title: 'Post One' })]
    render(<FilteredPostGrid posts={posts} selectedTag="Everything" onTagSelect={vi.fn()} />)
    expect(screen.getByText('Post One')).toBeInTheDocument()
  })

  it('shows empty message when no posts match tag', async () => {
    vi.doMock('next/navigation', () => ({
      useRouter: () => ({
        replace: vi.fn(),
      }),
      useSearchParams: () => new URLSearchParams(),
    }))

    const { FilteredPostGrid } = await import('@/app/_components/filtered-post-grid')
    render(
      <FilteredPostGrid posts={[]} selectedTag="Artificial Intelligence" onTagSelect={vi.fn()} />
    )
    expect(screen.getByText('No articles found for the selected tag.')).toBeInTheDocument()
  })

  it('shows prev/next pagination when many posts', async () => {
    vi.doMock('next/navigation', () => ({
      useRouter: () => ({
        replace: vi.fn(),
      }),
      useSearchParams: () => new URLSearchParams(),
    }))

    const { FilteredPostGrid } = await import('@/app/_components/filtered-post-grid')
    const manyPosts = Array.from({ length: 12 }, (_, i) =>
      makePost({ slug: `post-${i}`, title: `Post ${i}` })
    )
    render(<FilteredPostGrid posts={manyPosts} selectedTag="Everything" onTagSelect={vi.fn()} />)
    expect(screen.getByText('← Prev')).toBeInTheDocument()
    expect(screen.getByText('Next →')).toBeInTheDocument()
  })
})
