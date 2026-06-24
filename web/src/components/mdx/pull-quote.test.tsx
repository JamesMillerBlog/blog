import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('PullQuote', () => {
  it('renders quoted content', async () => {
    const { PullQuote } = await import('./pull-quote')
    render(<PullQuote>A notable insight</PullQuote>)
    expect(screen.getByText('A notable insight')).toBeInTheDocument()
  })

  it('renders author attribution when provided', async () => {
    const { PullQuote } = await import('./pull-quote')
    render(<PullQuote author="Jane Doe">Wisdom shared</PullQuote>)
    expect(screen.getByText('- Jane Doe')).toBeInTheDocument()
  })

  it('does not render author when not provided', async () => {
    const { PullQuote } = await import('./pull-quote')
    const { container } = render(<PullQuote>Just a quote</PullQuote>)
    const paragraphs = container.querySelectorAll('p')
    // Only the quote paragraph, no author paragraph
    const authorParagraphs = Array.from(paragraphs).filter((p) => p.textContent?.startsWith('-'))
    expect(authorParagraphs.length).toBe(0)
  })

  it('renders as blockquote element', async () => {
    const { PullQuote } = await import('./pull-quote')
    const { container } = render(<PullQuote>Quote text</PullQuote>)
    expect(container.querySelector('blockquote')).toBeInTheDocument()
  })
})
