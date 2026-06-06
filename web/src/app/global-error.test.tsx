import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

const mockCaptureException = vi.fn()

vi.mock('@sentry/nextjs', () => ({
  captureException: mockCaptureException,
}))

describe('GlobalError', () => {
  beforeEach(() => {
    mockCaptureException.mockReset()
  })

  it('renders the 500 heading', async () => {
    const GlobalError = (await import('./global-error')).default
    const error = new Error('Something broke')
    render(<GlobalError error={error} />)
    expect(screen.getByText('500')).toBeInTheDocument()
  })

  it('renders the "Something went wrong" subheading', async () => {
    const GlobalError = (await import('./global-error')).default
    const error = new Error('Test error')
    render(<GlobalError error={error} />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders the error description text', async () => {
    const GlobalError = (await import('./global-error')).default
    const error = new Error('Test error')
    render(<GlobalError error={error} />)
    expect(
      screen.getByText('An unexpected error occurred. It has been reported automatically.')
    ).toBeInTheDocument()
  })

  it('renders a "Go home" link pointing to /', async () => {
    const GlobalError = (await import('./global-error')).default
    const error = new Error('Test error')
    render(<GlobalError error={error} />)
    const link = screen.getByRole('link', { name: 'Go home' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/')
  })

  it('calls Sentry.captureException with the error', async () => {
    const GlobalError = (await import('./global-error')).default
    const error = new Error('captured error')
    render(<GlobalError error={error} />)
    expect(mockCaptureException).toHaveBeenCalledWith(error)
  })

  it('renders the main content area', async () => {
    const GlobalError = (await import('./global-error')).default
    const error = new Error('Test error')
    const { container } = render(<GlobalError error={error} />)
    expect(container.querySelector('main')).not.toBeNull()
  })
})
