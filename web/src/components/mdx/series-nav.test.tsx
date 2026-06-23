import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

vi.mock('lucide-react', () => ({
  BookOpenIcon: vi.fn((props: Record<string, unknown>) => (
    <svg data-testid="icon-book-open" {...props} />
  )),
  CheckIcon: vi.fn((props: Record<string, unknown>) => <svg data-testid="icon-check" {...props} />),
}))

const seriesPosts = [
  { title: 'Part One', slug: 'part-one' },
  { title: 'Part Two', slug: 'part-two' },
  { title: 'Part Three', slug: 'part-three' },
]

describe('SeriesNav', () => {
  it('renders series title', async () => {
    const { SeriesNav } = await import('./series-nav')
    render(<SeriesNav series="My Series" current={1} posts={seriesPosts} />)
    expect(screen.getByText('My Series')).toBeInTheDocument()
    expect(screen.getByText('Series')).toBeInTheDocument()
  })

  it('renders current post as non-link text', async () => {
    const { SeriesNav } = await import('./series-nav')
    render(<SeriesNav series="My Series" current={2} posts={seriesPosts} />)
    const currentEl = screen.getByText('Part Two')
    expect(currentEl.tagName).toBe('SPAN')
  })

  it('renders past posts with check icons', async () => {
    const { SeriesNav } = await import('./series-nav')
    const { container } = render(<SeriesNav series="My Series" current={2} posts={seriesPosts} />)
    const checkIcons = container.querySelectorAll('[data-testid="icon-check"]')
    expect(checkIcons.length).toBe(1)
  })

  it('renders future posts as links', async () => {
    const { SeriesNav } = await import('./series-nav')
    render(<SeriesNav series="My Series" current={1} posts={seriesPosts} />)
    const futureLink = screen.getByText('Part Three')
    expect(futureLink.tagName).toBe('A')
    expect(futureLink.getAttribute('href')).toBe('/posts/part-three')
  })

  it('renders part numbers for future posts', async () => {
    const { SeriesNav } = await import('./series-nav')
    render(<SeriesNav series="My Series" current={1} posts={seriesPosts} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})
