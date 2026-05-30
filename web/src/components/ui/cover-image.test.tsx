import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'

vi.mock('next/image', () => ({
  default: ({ src, alt, priority, className, ...props }: Record<string, unknown>) => (
    <img
      src={src as string}
      alt={alt as string}
      data-priority={priority ? 'true' : 'false'}
      className={className as string}
      {...props}
    />
  ),
}))

describe('CoverImage', () => {
  it('renders image with correct src and alt', async () => {
    const { default: CoverImage } = await import('@/components/ui/cover-image')
    const { container } = render(<CoverImage title="Test Post" src="/images/cover.jpg" />)
    const img = container.querySelector('img')!
    expect(img.getAttribute('src')).toBe('/images/cover.jpg')
    expect(img.getAttribute('alt')).toBe('Cover Image for Test Post')
  })

  it('passes priority prop to image', async () => {
    const { default: CoverImage } = await import('@/components/ui/cover-image')
    const { container } = render(<CoverImage title="Test" src="/cover.jpg" priority={true} />)
    const img = container.querySelector('img')!
    expect(img.getAttribute('data-priority')).toBe('true')
  })

  it('defaults priority to false', async () => {
    const { default: CoverImage } = await import('@/components/ui/cover-image')
    const { container } = render(<CoverImage title="Test" src="/cover.jpg" />)
    const img = container.querySelector('img')!
    expect(img.getAttribute('data-priority')).toBe('false')
  })
})
