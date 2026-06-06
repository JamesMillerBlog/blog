import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock lucide icons
vi.mock('lucide-react', () => ({
  CheckCircleIcon: vi.fn((props: Record<string, unknown>) => (
    <svg data-testid="icon-check-circle" {...props} />
  )),
  XCircleIcon: vi.fn((props: Record<string, unknown>) => (
    <svg data-testid="icon-x-circle" {...props} />
  )),
  BookOpenIcon: vi.fn((props: Record<string, unknown>) => (
    <svg data-testid="icon-book-open" {...props} />
  )),
  CheckIcon: vi.fn((props: Record<string, unknown>) => <svg data-testid="icon-check" {...props} />),
}))

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

describe('ProsCons', () => {
  it('renders pros and cons lists with default labels', async () => {
    const { ProsCons } = await import('./pros-cons')
    render(<ProsCons pros={['Fast', 'Reliable']} cons={['Expensive', 'Complex']} />)
    expect(screen.getByText('Pros')).toBeInTheDocument()
    expect(screen.getByText('Cons')).toBeInTheDocument()
    expect(screen.getByText('Fast')).toBeInTheDocument()
    expect(screen.getByText('Expensive')).toBeInTheDocument()
  })

  it('renders custom labels when provided', async () => {
    const { ProsCons } = await import('./pros-cons')
    render(
      <ProsCons pros={['Good']} cons={['Bad']} prosLabel="Advantages" consLabel="Disadvantages" />
    )
    expect(screen.getByText('Advantages')).toBeInTheDocument()
    expect(screen.getByText('Disadvantages')).toBeInTheDocument()
  })

  it('renders icons for both columns', async () => {
    const { ProsCons } = await import('./pros-cons')
    render(<ProsCons pros={['A']} cons={['B']} />)
    expect(screen.getByTestId('icon-check-circle')).toBeInTheDocument()
    expect(screen.getByTestId('icon-x-circle')).toBeInTheDocument()
  })

  it('renders empty lists without error', async () => {
    const { ProsCons } = await import('./pros-cons')
    const { container } = render(<ProsCons pros={[]} cons={[]} />)
    expect(container.querySelector('ul')).toBeInTheDocument()
  })
})

describe('ExampleGrid and ExampleCard', () => {
  it('renders grid with children', async () => {
    const { ExampleGrid } = await import('./example-grid')
    render(
      <ExampleGrid>
        <div data-testid="child">Child</div>
      </ExampleGrid>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('renders card with title and content', async () => {
    const { ExampleCard } = await import('./example-grid')
    render(
      <ExampleCard src="/img.jpg" alt="Example" title="My Example">
        Description text
      </ExampleCard>
    )
    expect(screen.getByText('My Example')).toBeInTheDocument()
    expect(screen.getByText('Description text')).toBeInTheDocument()
    expect(screen.getByAltText('Example')).toBeInTheDocument()
  })

  it('renders card title as link when href provided', async () => {
    const { ExampleCard } = await import('./example-grid')
    render(
      <ExampleCard src="/img.jpg" alt="Clickable" title="Link Card" href="https://example.com">
        Content
      </ExampleCard>
    )
    const link = screen.getByText('Link Card')
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('href')).toBe('https://example.com')
  })

  it('renders card title as paragraph when no href', async () => {
    const { ExampleCard } = await import('./example-grid')
    render(
      <ExampleCard src="/img.jpg" alt="Static" title="Static Card">
        Content
      </ExampleCard>
    )
    const title = screen.getByText('Static Card')
    expect(title.tagName).toBe('P')
  })
})

describe('FileTree', () => {
  it('renders file tree lines', async () => {
    const { FileTree } = await import('./file-tree')
    const tree = '├── src/\n├── index.ts\n└── README.md'
    const { container } = render(<FileTree>{tree}</FileTree>)
    expect(container.querySelector('pre')).toBeInTheDocument()
    expect(container.textContent).toContain('src/')
    expect(container.textContent).toContain('index.ts')
    expect(container.textContent).toContain('README.md')
  })

  it('colorizes directory tokens with primary class', async () => {
    const { FileTree } = await import('./file-tree')
    const { container } = render(<FileTree>{'src/'}</FileTree>)
    const dirSpan = container.querySelector('.text-primary')
    expect(dirSpan).not.toBeNull()
    expect(dirSpan!.textContent).toBe('src/')
  })

  it('colorizes TypeScript files with secondary class', async () => {
    const { FileTree } = await import('./file-tree')
    const { container } = render(<FileTree>{'app.tsx'}</FileTree>)
    const tsSpan = container.querySelector('.text-secondary')
    expect(tsSpan).not.toBeNull()
    expect(tsSpan!.textContent).toBe('app.tsx')
  })

  it('colorizes MDX files with tertiary class', async () => {
    const { FileTree } = await import('./file-tree')
    const { container } = render(<FileTree>{'post.mdx'}</FileTree>)
    const mdxSpan = container.querySelector('.text-tertiary')
    expect(mdxSpan).not.toBeNull()
    expect(mdxSpan!.textContent).toBe('post.mdx')
  })

  it('renders plain files without special colorization', async () => {
    const { FileTree } = await import('./file-tree')
    const { container } = render(<FileTree>{'config.json'}</FileTree>)
    // Plain files should not have primary/secondary/tertiary coloring
    expect(container.querySelector('.text-primary')).toBeNull()
    expect(container.querySelector('.text-secondary')).toBeNull()
    expect(container.querySelector('.text-tertiary')).toBeNull()
    expect(container.textContent).toContain('config.json')
  })

  it('renders lines that do not match the regex as plain divs', async () => {
    const { FileTree } = await import('./file-tree')
    // A line with only spaces/pipes matches the non-match branch in the map
    const { container } = render(<FileTree>{'   '}</FileTree>)
    expect(container.querySelector('pre')).toBeInTheDocument()
  })
})

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

describe('SeriesNav', () => {
  const seriesPosts = [
    { title: 'Part One', slug: 'part-one' },
    { title: 'Part Two', slug: 'part-two' },
    { title: 'Part Three', slug: 'part-three' },
  ]

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
    // Part 3 is future and should show number "3"
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})

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

describe('TechCard', () => {
  it('renders title and children', async () => {
    const { TechCard } = await import('./tech-card')
    render(
      <TechCard logo="/logo.png" title="React" href="https://react.dev">
        A JavaScript library for building UIs
      </TechCard>
    )
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('A JavaScript library for building UIs')).toBeInTheDocument()
  })

  it('renders logo image with alt text', async () => {
    const { TechCard } = await import('./tech-card')
    render(
      <TechCard logo="/logo.png" title="React" href="https://react.dev">
        Content
      </TechCard>
    )
    expect(screen.getByAltText('React logo')).toBeInTheDocument()
  })

  it('renders both links with correct href and target', async () => {
    const { TechCard } = await import('./tech-card')
    render(
      <TechCard logo="/logo.png" title="React" href="https://react.dev">
        Content
      </TechCard>
    )
    const links = screen.getAllByRole('link')
    expect(links.length).toBe(2)
    links.forEach((link) => {
      expect(link.getAttribute('href')).toBe('https://react.dev')
      expect(link.getAttribute('target')).toBe('_blank')
      expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    })
  })
})
