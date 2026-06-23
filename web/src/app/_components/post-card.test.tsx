import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, className, ...props }: Record<string, unknown>) => (
    <img src={src as string} alt={alt as string} className={className as string} {...props} />
  ),
}))

vi.mock('date-fns', () => ({
  format: vi.fn((date: string | Date) => {
    const d = new Date(date)
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]
    return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`
  }),
}))

vi.mock('@/common/utils/reading-time', () => ({
  readingTime: vi.fn(() => 4),
}))

const makePost = (overrides = {}) => ({
  slug: 'test-post',
  title: 'Test Post Title',
  date: '2024-06-15',
  coverImage: '/images/test.jpg',
  author: { name: 'Author', picture: '/pic.jpg' },
  excerpt: 'A short excerpt about the post',
  ogImage: { url: '/og.jpg' },
  content: 'Post content goes here with enough words to take time to read.',
  tags: ['aws', 'typescript'],
  ...overrides,
})

describe('PostCard', () => {
  it('renders post title', async () => {
    const { PostCard } = await import('./post-card')
    render(<PostCard post={makePost()} />)
    expect(screen.getByText('Test Post Title')).toBeInTheDocument()
  })

  it('renders post excerpt', async () => {
    const { PostCard } = await import('./post-card')
    render(<PostCard post={makePost()} />)
    expect(screen.getByText('A short excerpt about the post')).toBeInTheDocument()
  })

  it('renders cover image with correct alt text', async () => {
    const { PostCard } = await import('./post-card')
    render(<PostCard post={makePost()} />)
    expect(screen.getByAltText('Test Post Title')).toBeInTheDocument()
  })

  it('renders formatted date', async () => {
    const { PostCard } = await import('./post-card')
    render(<PostCard post={makePost()} />)
    expect(screen.getByText('Jun 15, 2024')).toBeInTheDocument()
  })

  it('renders reading time', async () => {
    const { PostCard } = await import('./post-card')
    render(<PostCard post={makePost()} />)
    expect(screen.getByText('4 min read')).toBeInTheDocument()
  })

  it('links to the correct post URL', async () => {
    const { PostCard } = await import('./post-card')
    render(<PostCard post={makePost({ slug: 'my-awesome-post' })} />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/posts/my-awesome-post')
  })

  it('renders tags limited to maximum 2', async () => {
    const { PostCard } = await import('./post-card')
    const post = makePost({ tags: ['aws', 'typescript', 'react', 'nextjs'] })
    render(<PostCard post={post} />)
    expect(screen.getByText('aws')).toBeInTheDocument()
    expect(screen.getByText('typescript')).toBeInTheDocument()
    expect(screen.queryByText('react')).not.toBeInTheDocument()
    expect(screen.queryByText('nextjs')).not.toBeInTheDocument()
  })

  it('renders no tags section when tags array is empty', async () => {
    const { PostCard } = await import('./post-card')
    const { container } = render(<PostCard post={makePost({ tags: [] })} />)
    // No uppercase tag spans should exist
    const tagSpans = container.querySelectorAll('.tracking-wider')
    expect(tagSpans.length).toBe(0)
  })

  it('renders no tags section when tags is undefined', async () => {
    const { PostCard } = await import('./post-card')
    const post = makePost()
    delete (post as Record<string, unknown>).tags
    const { container } = render(<PostCard post={post} />)
    const tagSpans = container.querySelectorAll('.tracking-wider')
    expect(tagSpans.length).toBe(0)
  })

  it('does not render image block when no cover image', async () => {
    const { PostCard } = await import('./post-card')
    const post = makePost()
    delete (post as Record<string, unknown>).coverImage
    post.coverImage = ''
    const { container } = render(<PostCard post={post} />)
    expect(container.querySelector('img')).toBeNull()
  })

  it('applies default variant classes', async () => {
    const { PostCard } = await import('./post-card')
    const { container } = render(<PostCard post={makePost()} />)
    const article = container.querySelector('article')
    expect(article?.className).toContain('bg-surface-container')
    expect(article?.className).toContain('hover:shadow-lg')
  })

  it('applies glow variant with animation style', async () => {
    const { PostCard } = await import('./post-card')
    const { container } = render(<PostCard post={makePost()} variant="glow" />)
    const article = container.querySelector('article')
    expect(article?.getAttribute('style')).toContain('gradientGlowBloom')
  })
})
