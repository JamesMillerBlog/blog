import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import type { Post } from '@/types/post'

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((_date: Date, _fmt: string) => 'Jan 1, 2024'),
}))

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: Record<string, unknown>) => (
    <img src={src as string} alt={alt as string} {...props} />
  ),
}))

vi.mock('lucide-react', () => ({
  BookOpenIcon: (props: Record<string, unknown>) => <svg data-testid="book-open" {...props} />,
}))

const makePost = (overrides: Partial<Post> = {}): Post => {
  return {
    slug: 'test-post',
    title: 'Test Blog Post',
    date: '2024-01-15',
    coverImage: '/cover.jpg',
    author: { name: 'James', picture: '/pic.jpg' },
    excerpt: 'Test excerpt',
    ogImage: { url: '/og.jpg' },
    content: 'Content here',
    tags: ['react', 'aws'],
    ...overrides,
  }
}

describe('RelatedPosts', () => {
  it('renders nothing when posts array is empty', async () => {
    const { RelatedPosts } = await import('@/app/posts/_components/related-posts')
    const { container } = render(<RelatedPosts posts={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders post titles as links', async () => {
    const { RelatedPosts } = await import('@/app/posts/_components/related-posts')
    render(
      <RelatedPosts
        posts={[
          makePost({ slug: 'post-a', title: 'First Post' }),
          makePost({ slug: 'post-b', title: 'Second Post' }),
        ]}
      />
    )
    expect(screen.getByText('First Post')).toBeInTheDocument()
    expect(screen.getByText('Second Post')).toBeInTheDocument()
  })

  it('links to correct post URLs', async () => {
    const { RelatedPosts } = await import('@/app/posts/_components/related-posts')
    render(<RelatedPosts posts={[makePost({ slug: 'my-post' })]} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/posts/my-post')
  })

  it('renders "More to Read" heading', async () => {
    const { RelatedPosts } = await import('@/app/posts/_components/related-posts')
    render(<RelatedPosts posts={[makePost()]} />)
    expect(screen.getByText('More to Read')).toBeInTheDocument()
  })

  it('renders up to 2 tags per post', async () => {
    const { RelatedPosts } = await import('@/app/posts/_components/related-posts')
    render(
      <RelatedPosts
        posts={[
          makePost({
            slug: 'tagged-post',
            tags: ['react', 'aws', 'typescript', 'node'],
          }),
        ]}
      />
    )
    // Only first 2 tags should render
    expect(screen.getByText('react')).toBeInTheDocument()
    expect(screen.getByText('aws')).toBeInTheDocument()
    expect(screen.queryByText('typescript')).not.toBeInTheDocument()
  })

  it('renders fallback icon when no cover image', async () => {
    const { RelatedPosts } = await import('@/app/posts/_components/related-posts')
    render(<RelatedPosts posts={[makePost({ slug: 'no-cover', coverImage: '' })]} />)
    // BookOpenIcon should be present
    const icon = document.querySelector('[data-testid="book-open"]')
    expect(icon).not.toBeNull()
  })
})
