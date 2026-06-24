import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('Screenshot', () => {
  it('renders image with alt text', async () => {
    const { Screenshot } = await import('./screenshot')
    render(<Screenshot src="/shot.png" alt="Screenshot of app" />)
    expect(screen.getByAltText('Screenshot of app')).toBeInTheDocument()
  })

  it('renders caption when provided', async () => {
    const { Screenshot } = await import('./screenshot')
    render(<Screenshot src="/shot.png" alt="Screenshot" caption="Figure 1: The dashboard" />)
    expect(screen.getByText('Figure 1: The dashboard')).toBeInTheDocument()
  })

  it('does not render caption element when no caption', async () => {
    const { Screenshot } = await import('./screenshot')
    const { container } = render(<Screenshot src="/shot.png" alt="Screenshot" />)
    expect(container.querySelector('figcaption')).toBeNull()
  })

  it('renders window chrome dots', async () => {
    const { Screenshot } = await import('./screenshot')
    const { container } = render(<Screenshot src="/shot.png" alt="Screenshot" />)
    const dots = container.querySelectorAll('.rounded-full')
    expect(dots.length).toBe(3)
  })
})
