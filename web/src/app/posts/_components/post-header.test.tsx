import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import type { Author } from '@/types/author'

vi.mock('next/image', () => ({
  default: ({ src, alt, className, width, height }: Record<string, unknown>) => (
    <img
      src={src as string}
      alt={alt as string}
      className={className as string}
      width={width as number}
      height={height as number}
    />
  ),
}))

vi.mock('lucide-react', () => ({
  ClockIcon: (props: Record<string, unknown>) => <svg data-testid="clock-icon" {...props} />,
}))

describe('PostHeader', () => {
  const author: Author = { name: 'James Miller', picture: '/pic.jpg' }

  it('renders the post title', async () => {
    const { PostHeader } = await import('./post-header')
    render(
      <PostHeader
        title="My Amazing Post"
        coverImage="/cover.jpg"
        date="2024-01-15"
        author={author}
        readingTime={5}
      />
    )
    expect(screen.getByText('My Amazing Post')).toBeInTheDocument()
  })

  it('renders author name in Avatar', async () => {
    const { PostHeader } = await import('./post-header')
    render(
      <PostHeader
        title="Post"
        coverImage="/cover.jpg"
        date="2024-01-15"
        author={author}
        readingTime={7}
      />
    )
    expect(screen.getByText('James Miller')).toBeInTheDocument()
  })

  it('renders reading time with unit', async () => {
    const { PostHeader } = await import('./post-header')
    render(
      <PostHeader
        title="Post"
        coverImage="/cover.jpg"
        date="2024-01-15"
        author={author}
        readingTime={7}
      />
    )
    expect(screen.getByText('7 min read')).toBeInTheDocument()
  })

  it('renders date via DateFormatter', async () => {
    const { PostHeader } = await import('./post-header')
    render(
      <PostHeader
        title="Post"
        coverImage="/cover.jpg"
        date="2024-01-15"
        author={author}
        readingTime={3}
      />
    )
    // DateFormatter should render the formatted date
    expect(screen.getByText('January 15, 2024')).toBeInTheDocument()
  })

  it('renders cover image', async () => {
    const { PostHeader } = await import('./post-header')
    const { container } = render(
      <PostHeader
        title="Post"
        coverImage="/cover.jpg"
        date="2024-01-15"
        author={author}
        readingTime={3}
      />
    )
    const imgs = container.querySelectorAll('img')
    expect(imgs.length).toBeGreaterThanOrEqual(2)
  })

  it('renders published label from i18n', async () => {
    const { PostHeader } = await import('./post-header')
    render(
      <PostHeader
        title="Post"
        coverImage="/cover.jpg"
        date="2024-01-15"
        author={author}
        readingTime={3}
      />
    )
    expect(screen.getByText('Published')).toBeInTheDocument()
  })
})
