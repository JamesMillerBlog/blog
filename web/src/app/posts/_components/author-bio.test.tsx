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
  GithubIcon: (props: Record<string, unknown>) => <svg data-testid="github-icon" {...props} />,
  TwitterIcon: (props: Record<string, unknown>) => <svg data-testid="twitter-icon" {...props} />,
}))

describe('AuthorBio', () => {
  it('renders author name', async () => {
    const { AuthorBio } = await import('@/app/posts/_components/author-bio')
    const author: Author = { name: 'James Miller', picture: '/pic.jpg' }
    render(<AuthorBio author={author} />)
    expect(screen.getByText('James Miller')).toBeInTheDocument()
  })

  it('renders author image', async () => {
    const { AuthorBio } = await import('@/app/posts/_components/author-bio')
    const author: Author = { name: 'James Miller', picture: '/pic.jpg' }
    const { container } = render(<AuthorBio author={author} />)
    // AuthorBio renders its own Image component directly
    const imgs = container.querySelectorAll('img')
    expect(imgs.length).toBeGreaterThan(0)
  })

  it('renders social links section', async () => {
    const { AuthorBio } = await import('@/app/posts/_components/author-bio')
    const author: Author = { name: 'James', picture: '/pic.jpg' }
    render(<AuthorBio author={author} />)
    // AuthorBio includes social links (Twitter/GitHub/LinkedIn)
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
  })
})
