import { describe, it, expect, vi } from 'vitest'

vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    section: 'section',
    span: 'span',
    p: 'p',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/app/_components/post-card', () => ({
  PostCard: ({ post }: { post: { title: string } }) => (
    <div data-testid="post-card">{post.title}</div>
  ),
}))

import React from 'react'
import { render, screen } from '@testing-library/react'
import type { Post } from '@/types/post'

const makePost = (overrides: Partial<Post> = {}): Post => ({
  slug: 'test-post',
  title: 'Test Post',
  date: '2024-01-15',
  coverImage: '/cover.jpg',
  author: { name: 'James', picture: '/pic.jpg' },
  excerpt: 'Excerpt',
  ogImage: { url: '/og.jpg' },
  content: 'Content',
  tags: [],
  ...overrides,
})

describe('WordFilteredPosts', () => {
  it('returns null when word maps to empty tag list (software)', async () => {
    const { WordFilteredPosts } = await import('./word-filtered-posts')
    const posts = [makePost({ tags: ['react'] })]
    const { container } = render(<WordFilteredPosts posts={posts} word="software" />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null when no posts match the word', async () => {
    const { WordFilteredPosts } = await import('./word-filtered-posts')
    const posts = [makePost({ tags: ['terraform'] })]
    const { container } = render(<WordFilteredPosts posts={posts} word="websites" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders matching posts for "websites" word', async () => {
    const { WordFilteredPosts } = await import('./word-filtered-posts')
    const posts = [
      makePost({ slug: 'react-post', title: 'React Post', tags: ['react'] }),
      makePost({ slug: 'other-post', title: 'Other Post', tags: ['terraform'] }),
    ]
    render(<WordFilteredPosts posts={posts} word="websites" />)
    expect(screen.getByText('React Post')).toBeInTheDocument()
    expect(screen.queryByText('Other Post')).not.toBeInTheDocument()
  })

  it('renders matching posts for "infrastructure" word', async () => {
    const { WordFilteredPosts } = await import('./word-filtered-posts')
    const posts = [makePost({ slug: 'tf-post', title: 'Terraform Post', tags: ['terraform'] })]
    render(<WordFilteredPosts posts={posts} word="infrastructure" />)
    expect(screen.getByText('Terraform Post')).toBeInTheDocument()
  })

  it('caps rendered posts at 6 (MAX_POSTS)', async () => {
    const { WordFilteredPosts } = await import('./word-filtered-posts')
    const posts = Array.from({ length: 10 }, (_, i) =>
      makePost({ slug: `post-${i}`, title: `Post ${i}`, tags: ['react'] })
    )
    render(<WordFilteredPosts posts={posts} word="websites" />)
    const cards = screen.getAllByTestId('post-card')
    expect(cards.length).toBe(6)
  })

  it('renders the label with word name', async () => {
    const { WordFilteredPosts } = await import('./word-filtered-posts')
    const posts = [makePost({ tags: ['react'] })]
    render(<WordFilteredPosts posts={posts} word="websites" />)
    expect(screen.getByText('Posts about websites')).toBeInTheDocument()
  })

  it('renders matching posts for "agents" word', async () => {
    const { WordFilteredPosts } = await import('./word-filtered-posts')
    const posts = [makePost({ slug: 'ai-post', title: 'AI Post', tags: ['ai'] })]
    render(<WordFilteredPosts posts={posts} word="agents" />)
    expect(screen.getByText('AI Post')).toBeInTheDocument()
  })

  it('returns null when word is not in WORD_TO_TAGS map (??  fallback)', async () => {
    // An unknown word hits the ?? [] fallback and then returns [] (length 0)
    const { WordFilteredPosts } = await import('./word-filtered-posts')
    const posts = [makePost({ tags: ['react'] })]
    const { container } = render(<WordFilteredPosts posts={posts} word="unknownword" />)
    expect(container.firstChild).toBeNull()
  })
})
