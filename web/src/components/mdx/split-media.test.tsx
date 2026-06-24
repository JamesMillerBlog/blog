import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('SplitMedia', () => {
  it('renders title and content', async () => {
    const { SplitMedia } = await import('./split-media')
    render(
      <SplitMedia src="/img.jpg" alt="Media" title="Feature Title">
        Body content here
      </SplitMedia>
    )
    expect(screen.getByText('Feature Title')).toBeInTheDocument()
    expect(screen.getByText('Body content here')).toBeInTheDocument()
  })

  it('renders image with alt text', async () => {
    const { SplitMedia } = await import('./split-media')
    render(
      <SplitMedia src="/img.jpg" alt="Media image" title="Feature">
        Content
      </SplitMedia>
    )
    expect(screen.getByAltText('Media image')).toBeInTheDocument()
  })

  it('renders caption when provided', async () => {
    const { SplitMedia } = await import('./split-media')
    render(
      <SplitMedia src="/img.jpg" alt="Media" title="Feature" caption="Image caption">
        Content
      </SplitMedia>
    )
    expect(screen.getByText('Image caption')).toBeInTheDocument()
  })

  it('uses md:flex-row layout by default', async () => {
    const { SplitMedia } = await import('./split-media')
    const { container } = render(
      <SplitMedia src="/img.jpg" alt="Media" title="Feature">
        Content
      </SplitMedia>
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('md:flex-row')
  })

  it('uses md:flex-row-reverse when reverse=true', async () => {
    const { SplitMedia } = await import('./split-media')
    const { container } = render(
      <SplitMedia src="/img.jpg" alt="Media" title="Feature" reverse={true}>
        Content
      </SplitMedia>
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('md:flex-row-reverse')
  })
})
