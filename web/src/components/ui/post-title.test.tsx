import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { PostTitle } from './post-title'

describe('PostTitle', () => {
  it('renders an h1 tag', () => {
    const { container } = render(<PostTitle>Hello World</PostTitle>)
    const h1 = container.querySelector('h1')
    expect(h1).not.toBeNull()
  })

  it('renders children text', () => {
    render(<PostTitle>My Blog Post</PostTitle>)
    expect(screen.getByText('My Blog Post')).toBeInTheDocument()
  })

  it('renders React elements as children', () => {
    render(
      <PostTitle>
        <span data-testid="inner">Nested</span>
      </PostTitle>
    )
    expect(screen.getByTestId('inner')).toHaveTextContent('Nested')
  })

  it('has proper CSS classes for typography', () => {
    const { container } = render(<PostTitle>Test</PostTitle>)
    const h1 = container.querySelector('h1')!
    expect(h1.className).toContain('font-headline')
    expect(h1.className).toContain('text-on-surface')
  })
})
