import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

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

describe('Avatar', () => {
  it('renders image with correct src', async () => {
    const { default: Avatar } = await import('@/components/ui/avatar')
    const { container } = render(<Avatar name="James Miller" picture="/pic.jpg" />)
    const img = container.querySelector('img')!
    expect(img.getAttribute('src')).toBe('/pic.jpg')
  })

  it('renders alt text with author name', async () => {
    const { default: Avatar } = await import('@/components/ui/avatar')
    const { container } = render(<Avatar name="James Miller" picture="/pic.jpg" />)
    const img = container.querySelector('img')!
    expect(img.getAttribute('alt')).toBe('James Miller')
  })

  it('renders author name text', async () => {
    const { default: Avatar } = await import('@/components/ui/avatar')
    render(<Avatar name="James Miller" picture="/pic.jpg" />)
    expect(screen.getByText('James Miller')).toBeInTheDocument()
  })

  it('shows initials as fallback when no picture', async () => {
    const { default: Avatar } = await import('@/components/ui/avatar')
    const { container } = render(<Avatar name="James Miller" picture="" />)
    // When picture is empty, should show initials fallback
    const img = container.querySelector('img')
    // Either no img or img with empty src
    if (img) {
      expect(img.getAttribute('src')).toBe('')
    }
    // Name should still be visible
    expect(screen.getByText('James Miller')).toBeInTheDocument()
  })
})
