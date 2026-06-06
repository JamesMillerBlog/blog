import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
      <div className={className} style={style} data-testid="progress-bar" />
    ),
  },
  useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
  useSpring: (v: unknown) => v,
}))

describe('ReadingProgress', () => {
  it('renders without crashing', async () => {
    const { ReadingProgress } = await import('./reading-progress')
    expect(() => render(<ReadingProgress />)).not.toThrow()
  })

  it('renders a fixed progress bar element', async () => {
    const { ReadingProgress } = await import('./reading-progress')
    const { getByTestId } = render(<ReadingProgress />)
    expect(getByTestId('progress-bar')).toBeInTheDocument()
  })

  it('applies fixed positioning classes', async () => {
    const { ReadingProgress } = await import('./reading-progress')
    const { getByTestId } = render(<ReadingProgress />)
    const bar = getByTestId('progress-bar')
    expect(bar.className).toContain('fixed')
    expect(bar.className).toContain('top-0')
  })

  it('applies gradient background', async () => {
    const { ReadingProgress } = await import('./reading-progress')
    const { getByTestId } = render(<ReadingProgress />)
    const bar = getByTestId('progress-bar')
    expect(bar.className).toContain('bg-gradient-to-r')
  })
})
