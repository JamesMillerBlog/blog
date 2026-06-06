import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Mock table-of-contents to avoid IntersectionObserver issues
vi.mock('./table-of-contents', () => ({
  TableOfContents: () => <div data-testid="toc-sidebar">TOC</div>,
  InlineTableOfContents: () => <div data-testid="toc-inline">InlineTOC</div>,
}))

describe('PostBody', () => {
  it('renders content inside markdown div', async () => {
    const { PostBody } = await import('./post-body')
    const content = <p>Post content here</p>
    render(<PostBody content={content} />)
    expect(screen.getByText('Post content here')).toBeInTheDocument()
  })

  it('renders inline TOC', async () => {
    const { PostBody } = await import('./post-body')
    render(<PostBody content={<p>Test</p>} />)
    expect(screen.getByTestId('toc-inline')).toBeInTheDocument()
  })

  it('renders sidebar TOC', async () => {
    const { PostBody } = await import('./post-body')
    render(<PostBody content={<p>Test</p>} />)
    expect(screen.getByTestId('toc-sidebar')).toBeInTheDocument()
  })

  it('renders with xl grid layout', async () => {
    const { PostBody } = await import('./post-body')
    const { container } = render(<PostBody content={<p>Test</p>} />)
    const grid = container.querySelector('.xl\\:grid')
    expect(grid).not.toBeNull()
  })
})
