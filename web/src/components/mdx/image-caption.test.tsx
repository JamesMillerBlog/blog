import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/image', () => ({
  default: ({ src, alt, className, ...props }: Record<string, unknown>) => (
    <img src={src as string} alt={alt as string} className={className as string} {...props} />
  ),
}))

describe('ImageCaption', () => {
  it('renders image with caption', async () => {
    const { ImageCaption } = await import('./image-caption')
    render(<ImageCaption src="/img.jpg" alt="Alt text" caption="A caption" />)
    expect(screen.getByText('A caption')).toBeInTheDocument()
  })

  it('renders image with correct alt text', async () => {
    const { ImageCaption } = await import('./image-caption')
    render(<ImageCaption src="/img.jpg" alt="Descriptive alt" caption="Caption" />)
    expect(screen.getByAltText('Descriptive alt')).toBeInTheDocument()
  })

  it('renders figcaption element', async () => {
    const { ImageCaption } = await import('./image-caption')
    const { container } = render(<ImageCaption src="/img.jpg" alt="Alt" caption="Caption text" />)
    expect(container.querySelector('figcaption')).toBeInTheDocument()
  })
})
