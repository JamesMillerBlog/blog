import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock framer-motion to render children directly (avoid animation complexity in jsdom)
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => (
      <div data-testid="motion-div" {...props}>
        {children as React.ReactNode}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, className, fill, priority, ...props }: Record<string, unknown>) => (
    <img
      src={src as string}
      alt={alt as string}
      className={className as string}
      data-fill={fill ? 'true' : 'false'}
      data-priority={priority ? 'true' : 'false'}
      {...props}
    />
  ),
}))

vi.mock('@/i18n/en', () => ({
  ui: {
    projects: {
      empty: 'No projects found for the selected category.',
      heading: "Things I've",
      description: '',
    },
    nav: {},
    footer: {},
    home: {
      wordPosts: { postsAbout: () => '' },
      tagCloud: { heading: '' },
      postGrid: { empty: '', prev: '', next: '' },
    },
    posts: { backToBlog: '' },
    search: {
      placeholder: '',
      empty: '',
      noResults: () => '',
      shortcut: '',
      toOpen: '',
      posts: '',
      projects: '',
    },
    notFound: { code: '', heading: '', description: '', backHome: '' },
  },
}))

const mockProjects = [
  {
    slug: 'proj-alpha',
    title: 'Alpha Project',
    description: 'First project',
    company: 'AlphaCo',
    year: 2024,
    category: 'Web' as const,
    tags: ['react', 'nextjs'],
    portfolio: true,
    order: 1,
  },
  {
    slug: 'proj-beta',
    title: 'Beta Project',
    description: 'Second project',
    company: 'BetaCo',
    year: 2024,
    category: 'Web' as const,
    tags: ['vue'],
    portfolio: true,
    order: 2,
  },
  {
    slug: 'proj-gamma',
    title: 'Gamma Project',
    description: 'Third project',
    company: 'GammaCo',
    year: 2023,
    category: 'Artificial Intelligence' as const,
    tags: ['ai', 'python'],
    portfolio: true,
    order: 3,
  },
  {
    slug: 'proj-delta',
    title: 'Delta Project',
    description: 'Non-portfolio project',
    company: 'DeltaCo',
    year: 2023,
    category: 'Web' as const,
    tags: ['svelte'],
    portfolio: false,
  },
]

const mockCategories = ['Highlights', 'All', 'Web', 'Artificial Intelligence', 'Extended Reality']

describe('ProjectsTimeline', () => {
  const importTimeline = () =>
    import('./projects-timeline').then((m) => ({ ProjectsTimeline: m.ProjectsTimeline }))

  it('renders category buttons', async () => {
    const { ProjectsTimeline } = await importTimeline()
    render(<ProjectsTimeline projects={mockProjects} categories={mockCategories} />)
    mockCategories.forEach((cat) => {
      // Category names like 'Web' also appear as project badges — use getAllByText
      const elements = screen.getAllByText(cat)
      expect(elements.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('highlights selected category button', async () => {
    const { ProjectsTimeline } = await importTimeline()
    render(
      <ProjectsTimeline
        projects={mockProjects}
        categories={mockCategories}
        selectedCategory="Web"
      />
    )
    // 'Web' appears both as category button and project badge
    const elements = screen.getAllByText('Web')
    const button = elements.find((el) => el.tagName === 'BUTTON')
    expect(button).not.toBeUndefined()
    expect(button!.className).toContain('bg-secondary-container')
  })

  it('filters projects by selected category', async () => {
    const { ProjectsTimeline } = await importTimeline()
    render(
      <ProjectsTimeline
        projects={mockProjects}
        categories={mockCategories}
        selectedCategory="Web"
      />
    )
    // All 3 projects have category 'Web', but only portfolio ones show in Highlights
    // For category Web (not Highlights), all matching projects show
    const titles = screen.getAllByText('Alpha Project')
    expect(titles.length).toBeGreaterThanOrEqual(1)
  })

  it('shows empty message when no projects match category', async () => {
    const { ProjectsTimeline } = await importTimeline()
    render(
      <ProjectsTimeline
        projects={mockProjects}
        categories={mockCategories}
        selectedCategory="Extended Reality"
      />
    )
    expect(screen.getByText('No projects found for the selected category.')).toBeInTheDocument()
  })

  it('renders project card with title and company', async () => {
    const { ProjectsTimeline } = await importTimeline()
    render(<ProjectsTimeline projects={mockProjects} categories={mockCategories} />)
    // Use getAllByText because multiple DOM branches render simultaneously in jsdom
    const titles = screen.getAllByText('Alpha Project')
    expect(titles.length).toBeGreaterThanOrEqual(1)
    const companies = screen.getAllByText('AlphaCo')
    expect(companies.length).toBeGreaterThanOrEqual(1)
  })

  it('renders project tags', async () => {
    const { ProjectsTimeline } = await importTimeline()
    render(<ProjectsTimeline projects={mockProjects} categories={mockCategories} />)
    // Tags appear in both mobile and desktop DOM branches — use getAllByText
    const reactTags = screen.getAllByText('react')
    expect(reactTags.length).toBeGreaterThanOrEqual(1)
    const nextjsTags = screen.getAllByText('nextjs')
    expect(nextjsTags.length).toBeGreaterThanOrEqual(1)
  })

  it('renders year labels for non-highlights view', async () => {
    const { ProjectsTimeline } = await importTimeline()
    render(
      <ProjectsTimeline
        projects={mockProjects}
        categories={mockCategories}
        selectedCategory="All"
      />
    )
    // Year labels should be present
    const yearLabels = screen.getAllByText('2024')
    expect(yearLabels.length).toBeGreaterThanOrEqual(1)
  })

  it('renders filtered view based on selectedCategory', async () => {
    const { ProjectsTimeline } = await importTimeline()
    render(
      <ProjectsTimeline
        projects={mockProjects}
        categories={mockCategories}
        selectedCategory="Artificial Intelligence"
      />
    )
    // Project titles appear in both mobile and desktop DOM branches
    const titles = screen.getAllByText('Gamma Project')
    expect(titles.length).toBeGreaterThanOrEqual(1)
  })

  it('calls onCategoryChange when category button clicked', async () => {
    const onCategoryChange = vi.fn()
    const { ProjectsTimeline } = await importTimeline()
    render(
      <ProjectsTimeline
        projects={mockProjects}
        categories={mockCategories}
        onCategoryChange={onCategoryChange}
      />
    )
    fireEvent.click(screen.getByText('All'))
    expect(onCategoryChange).toHaveBeenCalledWith('All')
  })

  it('applies flashCategory class to matching button', async () => {
    const { ProjectsTimeline } = await importTimeline()
    render(
      <ProjectsTimeline
        projects={mockProjects}
        categories={mockCategories}
        selectedCategory="Highlights"
        flashCategory="Web"
      />
    )
    // 'Web' appears as both button and project badge — find the button element
    const elements = screen.getAllByText('Web')
    const button = elements.find((el) => el.tagName === 'BUTTON')
    expect(button).not.toBeUndefined()
    expect(button!.className).toContain('scale-110')
    expect(button!.className).toContain('ring-2')
  })

  it('renders non-portfolio projects when not in Highlights', async () => {
    const { ProjectsTimeline } = await importTimeline()
    render(
      <ProjectsTimeline
        projects={mockProjects}
        categories={mockCategories}
        selectedCategory="All"
      />
    )
    // Delta appears in both mobile and desktop DOM branches
    const titles = screen.getAllByText('Delta Project')
    expect(titles.length).toBeGreaterThanOrEqual(1)
  })

  it('renders YouTube thumbnails for projects with youtubeId', async () => {
    const projectsWithVideo = [
      {
        ...mockProjects[0],
        youtubeId: 'dQw4w9WgXcQ',
      },
    ]
    const { ProjectsTimeline } = await importTimeline()
    const { container } = render(
      <ProjectsTimeline projects={projectsWithVideo} categories={mockCategories} />
    )
    // YouTube thumbnail image should be present
    const img = container.querySelector('img[src*="youtube"]')
    expect(img).not.toBeNull()
  })
})
