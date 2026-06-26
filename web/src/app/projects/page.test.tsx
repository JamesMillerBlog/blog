import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'

vi.mock('@/app/projects/data', () => ({
  projects: [
    {
      slug: 'p1',
      title: 'Project 1',
      description: '',
      company: '',
      year: 2024,
      category: 'Web',
      tags: [],
      portfolio: true,
    },
    {
      slug: 'p2',
      title: 'Project 2',
      description: '',
      company: '',
      year: 2023,
      category: 'Artificial Intelligence',
      tags: [],
      portfolio: false,
    },
  ],
  getCategories: vi.fn(() => ['Highlights', 'All', 'Web', 'Artificial Intelligence']),
}))

vi.mock('@/app/projects/_components/projects-page-client', () => ({
  ProjectsPageClient: ({ projects, categories }: { projects: unknown[]; categories: string[] }) => (
    <div
      data-testid="projects-page-client"
      data-project-count={projects.length}
      data-category-count={categories.length}
    />
  ),
}))

vi.mock('@/i18n/en', () => ({
  ui: {
    projects: { description: 'A decade of products', heading: '', empty: '' },
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

describe('Projects page', () => {
  it('renders project metadata', async () => {
    const mod = await import('./page')
    expect(mod.metadata).toBeDefined()
    expect(mod.metadata.title).toBe('Projects')
  })

  it('renders ProjectsPageClient with projects and categories', async () => {
    const { default: ProjectsPage } = await import('./page')
    const element = ProjectsPage()
    const { container } = render(element)
    const client = container.querySelector('[data-testid="projects-page-client"]')
    expect(client).toBeInTheDocument()
    expect(client?.getAttribute('data-project-count')).toBe('2')
    expect(client?.getAttribute('data-category-count')).toBe('4')
  })
})
