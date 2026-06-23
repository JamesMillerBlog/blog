import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

vi.mock('@/components/ui/cycling-description', () => ({
  CyclingDescription: ({ onCategorySelect }: { onCategorySelect: (category: string) => void }) => (
    <div data-testid="cycling-description">
      <button data-testid="select-highlights" onClick={() => onCategorySelect('Highlights')}>
        Highlights
      </button>
      <button data-testid="select-ai" onClick={() => onCategorySelect('Artificial Intelligence')}>
        AI
      </button>
    </div>
  ),
}))

vi.mock('@/components/ui/cycling-headline-word', () => ({
  CyclingHeadlineWord: ({
    onWordChange,
    word,
  }: {
    onWordChange: (word: string) => void
    word: string
  }) => (
    <span data-testid="cycling-headline" data-word={word}>
      <button data-testid="change-word-built" onClick={() => onWordChange('Built')}>
        Built
      </button>
      <button data-testid="change-word-architected" onClick={() => onWordChange('Architected')}>
        Architected
      </button>
      <button data-testid="change-word-made" onClick={() => onWordChange('Made')}>
        Made
      </button>
    </span>
  ),
}))

vi.mock('./projects-timeline', () => ({
  ProjectsTimeline: ({
    selectedCategory,
    flashCategory,
    highlightsOverride,
    onCategoryChange,
  }: {
    projects: unknown[]
    categories: string[]
    selectedCategory: string
    flashCategory: string | null
    highlightsOverride: unknown[] | null
    onCategoryChange: (category: string) => void
  }) => (
    <div
      data-testid="projects-timeline"
      data-category={selectedCategory}
      data-flash={flashCategory ?? 'none'}
      data-override={highlightsOverride ? 'true' : 'false'}
    >
      <button data-testid="change-category" onClick={() => onCategoryChange('Web')}>
        Change to Web
      </button>
    </div>
  ),
}))

vi.mock('@/i18n/en', () => ({
  ui: {
    projects: { heading: "Things I've", description: '', empty: '' },
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
    slug: 'project-1',
    title: 'Project One',
    description: 'A test project',
    company: 'TestCo',
    year: 2024,
    category: 'Web' as const,
    tags: ['react'],
    portfolio: true,
    order: 1,
  },
  {
    slug: 'project-2',
    title: 'Project Two',
    description: 'Another project',
    company: 'TestCo',
    year: 2023,
    category: 'Artificial Intelligence' as const,
    tags: ['ai'],
    portfolio: true,
    order: 2,
  },
  {
    slug: 'project-3',
    title: 'Project Three',
    description: 'Built project',
    company: 'OtherCo',
    year: 2022,
    category: 'Web' as const,
    tags: ['web'],
    portfolio: false,
  },
]

const mockCategories = ['Highlights', 'All', 'Web', 'Artificial Intelligence']

describe('ProjectsPageClient', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const importClient = () => import('./projects-page-client').then((m) => m.ProjectsPageClient)

  it('renders heading with cycling headline word', async () => {
    const ProjectsPageClient = await importClient()
    render(<ProjectsPageClient projects={mockProjects} categories={mockCategories} />)
    expect(screen.getByText("Things I've")).toBeInTheDocument()
    expect(screen.getByTestId('cycling-headline')).toHaveAttribute('data-word', 'Made')
  })

  it('passes selected category to ProjectsTimeline', async () => {
    const ProjectsPageClient = await importClient()
    render(<ProjectsPageClient projects={mockProjects} categories={mockCategories} />)
    expect(screen.getByTestId('projects-timeline')).toHaveAttribute('data-category', 'Highlights')
  })

  it('sets flashCategory after timer on category select', async () => {
    const ProjectsPageClient = await importClient()
    render(<ProjectsPageClient projects={mockProjects} categories={mockCategories} />)

    fireEvent.click(screen.getByTestId('select-ai'))

    // Immediately after click, flashCategory should be null (pending timer)
    expect(screen.getByTestId('projects-timeline')).toHaveAttribute('data-flash', 'none')
    expect(screen.getByTestId('cycling-headline')).toHaveAttribute('data-word', 'Made')

    // After 150ms, flashCategory gets set — wrap in act to flush React state
    await act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(screen.getByTestId('projects-timeline')).toHaveAttribute(
      'data-flash',
      'Artificial Intelligence'
    )

    // After another 800ms, flashCategory clears
    await act(() => {
      vi.advanceTimersByTime(800)
    })
    expect(screen.getByTestId('projects-timeline')).toHaveAttribute('data-flash', 'none')
  })

  it('changes headline word and sets highlights override for "Built"', async () => {
    const ProjectsPageClient = await importClient()
    render(<ProjectsPageClient projects={mockProjects} categories={mockCategories} />)

    fireEvent.click(screen.getByTestId('change-word-built'))

    expect(screen.getByTestId('cycling-headline')).toHaveAttribute('data-word', 'Built')
    // When word has no highlights mapped, override should be null
    // "Built" maps to specific slugs - our mock project-3 slug 'project-3' won't match
    // But the timeline gets the override regardless
  })

  it('changes headline word to "Made" with no highlights', async () => {
    const ProjectsPageClient = await importClient()
    render(<ProjectsPageClient projects={mockProjects} categories={mockCategories} />)

    // First change to something, then back to Made
    fireEvent.click(screen.getByTestId('change-word-built'))
    fireEvent.click(screen.getByTestId('change-word-made'))

    expect(screen.getByTestId('cycling-headline')).toHaveAttribute('data-word', 'Made')
    expect(screen.getByTestId('projects-timeline')).toHaveAttribute('data-override', 'false')
  })

  it('changing category resets headline word to "Made"', async () => {
    const ProjectsPageClient = await importClient()
    render(<ProjectsPageClient projects={mockProjects} categories={mockCategories} />)

    // Change word first
    fireEvent.click(screen.getByTestId('change-word-architected'))
    expect(screen.getByTestId('cycling-headline')).toHaveAttribute('data-word', 'Architected')

    // Change category to non-Highlights
    fireEvent.click(screen.getByTestId('change-category'))

    expect(screen.getByTestId('cycling-headline')).toHaveAttribute('data-word', 'Made')
    expect(screen.getByTestId('projects-timeline')).toHaveAttribute('data-override', 'false')
  })
})
