import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
  },
}))

vi.mock('posthog-js/react', () => ({
  PostHogProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  usePostHog: () => ({ capture: vi.fn() }),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/test',
  useSearchParams: () => ({ size: 0, toString: () => '' }),
}))

import { PostHogProvider } from './posthog-provider'

describe('PostHogProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children', () => {
    render(
      <PostHogProvider>
        <div data-testid="child">Hello</div>
      </PostHogProvider>
    )
    expect(screen.getByTestId('child')).toHaveTextContent('Hello')
  })

  it('does not init posthog when key is missing', async () => {
    const posthog = (await import('posthog-js')).default
    render(
      <PostHogProvider>
        <div />
      </PostHogProvider>
    )
    expect(posthog.init).not.toHaveBeenCalled()
  })

  it('inits posthog when key is present', async () => {
    const posthog = (await import('posthog-js')).default
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'test-key'
    render(
      <PostHogProvider>
        <div />
      </PostHogProvider>
    )
    expect(posthog.init).toHaveBeenCalledWith(
      'test-key',
      expect.objectContaining({
        capture_pageview: false,
        capture_pageleave: true,
        person_profiles: 'identified_only',
      })
    )
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY
  })
})
