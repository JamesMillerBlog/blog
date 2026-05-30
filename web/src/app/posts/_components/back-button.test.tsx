import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

const mockBack = vi.fn()
const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}))

// Mock lucide-react
vi.mock('lucide-react', () => ({
  ArrowLeftIcon: (props: Record<string, unknown>) => <svg data-testid="arrow-left" {...props} />,
}))

describe('BackButton', () => {
  beforeEach(() => {
    mockBack.mockReset()
    mockPush.mockReset()
  })

  it('renders the label text', async () => {
    const { BackButton } = await import('@/app/posts/_components/back-button')
    render(<BackButton label="Back to blog" />)
    expect(screen.getByText('Back to blog')).toBeInTheDocument()
  })

  it('navigates back when referrer is same origin', async () => {
    // jsdom window.location.origin is 'http://localhost:3000'
    Object.defineProperty(document, 'referrer', {
      value: `${window.location.origin}/posts/some-post`,
      configurable: true,
    })

    const { BackButton } = await import('@/app/posts/_components/back-button')
    render(<BackButton label="Back to blog" />)
    fireEvent.click(screen.getByText('Back to blog'))

    expect(mockBack).toHaveBeenCalled()
  })

  it('navigates to / when referrer is different origin', async () => {
    Object.defineProperty(document, 'referrer', {
      value: 'https://google.com',
      configurable: true,
    })

    const { BackButton } = await import('@/app/posts/_components/back-button')
    render(<BackButton label="Back to blog" />)
    fireEvent.click(screen.getByText('Back to blog'))

    expect(mockPush).toHaveBeenCalledWith('/')
  })
})
