import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

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

describe('NotFound', () => {
  it('renders the 404 code', async () => {
    const NotFound = (await import('./not-found')).default
    render(<NotFound />)
    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('renders the "Oops! Page not found" heading', async () => {
    const NotFound = (await import('./not-found')).default
    render(<NotFound />)
    expect(screen.getByText('Oops! Page not found')).toBeInTheDocument()
  })

  it('renders the description text', async () => {
    const NotFound = (await import('./not-found')).default
    render(<NotFound />)
    expect(
      screen.getByText(
        'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.'
      )
    ).toBeInTheDocument()
  })

  it('renders a link to go back home', async () => {
    const NotFound = (await import('./not-found')).default
    render(<NotFound />)
    const link = screen.getByRole('link', { name: 'Go back to Homepage' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/')
  })
})
