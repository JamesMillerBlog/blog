import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Footer imports next/link and next/image — mock Next.js
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

describe('Footer', () => {
  beforeEach(async () => {
    vi.resetModules()
  })

  it('renders copyright with current year', async () => {
    const { Footer } = await import('@/components/footer')
    render(<Footer />)
    const year = new Date().getFullYear()
    expect(screen.getByText(`© ${year} James Miller`)).toBeInTheDocument()
  })

  it('renders social links with correct hrefs', async () => {
    const { Footer } = await import('@/components/footer')
    render(<Footer />)

    const twitterLink = screen.getByLabelText('X (Twitter)')
    expect(twitterLink).toHaveAttribute('href', 'https://twitter.com/JamesMillerBlog')
    expect(twitterLink).toHaveAttribute('target', '_blank')
    expect(twitterLink).toHaveAttribute('rel', 'noopener noreferrer')

    const githubLink = screen.getByLabelText('GitHub')
    expect(githubLink).toHaveAttribute('href', 'https://github.com/jamesmillerblog')

    const linkedinLink = screen.getByLabelText('LinkedIn')
    expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com/in/jamesmillerblog')

    const rssLink = screen.getByLabelText('RSS feed')
    expect(rssLink).toHaveAttribute('href', '/feed.xml')
  })

  it('renders exactly 4 social icons', async () => {
    const { Footer } = await import('@/components/footer')
    render(<Footer />)
    const svgs = document.querySelectorAll('footer svg')
    expect(svgs).toHaveLength(4)
  })
})
