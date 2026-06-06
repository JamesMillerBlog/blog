import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const mockPush = vi.fn()
const mockReplace = vi.fn()
const mockSearchParamsGet = vi.fn()
const mockSearchParamsToString = vi.fn(() => '')

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => ({
    get: mockSearchParamsGet,
    toString: mockSearchParamsToString,
  }),
}))

// Mock child components to isolate HomeContent logic
vi.mock('./hero-section', () => ({
  HeroSection: ({ word, onWordChange }: { word: string; onWordChange: (w: string) => void }) => (
    <div data-testid="hero-section">
      <span data-testid="hero-word">{word}</span>
      <button data-testid="hero-word-change" onClick={() => onWordChange('cloud')}>
        Change word
      </button>
    </div>
  ),
}))

vi.mock('./tag-cloud-section', () => ({
  TagCloudSection: ({
    tags,
    posts,
    selectedTag,
    onTagSelect,
  }: {
    tags: string[]
    posts: unknown[]
    selectedTag: string
    onTagSelect: (t: string) => void
  }) => (
    <div data-testid="tag-cloud-section">
      <span data-testid="selected-tag">{selectedTag}</span>
      <span data-testid="tags-count">{tags.length}</span>
      <span data-testid="posts-count">{posts.length}</span>
      <button data-testid="tag-select-btn" onClick={() => onTagSelect('aws')}>
        Select AWS
      </button>
    </div>
  ),
}))

vi.mock('./filtered-post-grid', () => ({
  FilteredPostGrid: ({
    posts,
    selectedTag,
    onTagSelect,
  }: {
    posts: unknown[]
    selectedTag: string
    onTagSelect: (t: string) => void
  }) => (
    <div data-testid="filtered-post-grid">
      <span data-testid="grid-tag">{selectedTag}</span>
      <span data-testid="grid-posts">{posts.length}</span>
      <button data-testid="grid-tag-select" onClick={() => onTagSelect('serverless')}>
        Select serverless
      </button>
    </div>
  ),
}))

vi.mock('./word-filtered-posts', () => ({
  WordFilteredPosts: ({ posts, word }: { posts: unknown[]; word: string }) => (
    <div data-testid="word-filtered-posts">
      <span data-testid="wfp-word">{word}</span>
      <span data-testid="wfp-posts">{posts.length}</span>
    </div>
  ),
}))

const mockPost = {
  coverImage: '/img.jpg',
  author: { name: 'Author', picture: '/pic.jpg' },
  excerpt: 'Excerpt',
  ogImage: { url: '/og.jpg' },
  content: '',
}
const mockPosts = [
  { slug: 'post-1', title: 'Post 1', date: '2024-01-01', tags: ['aws'], ...mockPost },
  { slug: 'post-2', title: 'Post 2', date: '2024-02-01', tags: ['serverless'], ...mockPost },
]
const mockTags = ['aws', 'serverless', 'typescript']

describe('HomeContent', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSearchParamsGet.mockReturnValue(null)
    mockSearchParamsToString.mockReturnValue('')
  })

  const importHomeContent = () =>
    import('./home-content').then((m) => ({ HomeContent: m.HomeContent }))

  it('renders HeroSection with default word "software"', async () => {
    const { HomeContent } = await importHomeContent()
    render(<HomeContent allPosts={mockPosts} featuredTags={mockTags} />)
    expect(screen.getByTestId('hero-word').textContent).toBe('software')
  })

  it('renders TagCloudSection with featured tags and posts', async () => {
    const { HomeContent } = await importHomeContent()
    render(<HomeContent allPosts={mockPosts} featuredTags={mockTags} />)
    expect(screen.getByTestId('tags-count').textContent).toBe('3')
    expect(screen.getByTestId('posts-count').textContent).toBe('2')
  })

  it('defaults selectedTag to "Everything" when no search param', async () => {
    const { HomeContent } = await importHomeContent()
    render(<HomeContent allPosts={mockPosts} featuredTags={mockTags} />)
    expect(screen.getByTestId('selected-tag').textContent).toBe('Everything')
  })

  it('reads tag from search params', async () => {
    mockSearchParamsGet.mockImplementation((key: string) => (key === 'tag' ? 'aws' : null))
    const { HomeContent } = await importHomeContent()
    render(<HomeContent allPosts={mockPosts} featuredTags={mockTags} />)
    expect(screen.getByTestId('selected-tag').textContent).toBe('aws')
  })

  it('shows WordFilteredPosts when selectedTag is "Everything"', async () => {
    const { HomeContent } = await importHomeContent()
    render(<HomeContent allPosts={mockPosts} featuredTags={mockTags} />)
    expect(screen.getByTestId('word-filtered-posts')).toBeInTheDocument()
    expect(screen.getByTestId('wfp-word').textContent).toBe('software')
  })

  it('hides WordFilteredPosts when a tag is selected', async () => {
    mockSearchParamsGet.mockImplementation((key: string) => (key === 'tag' ? 'aws' : null))
    const { HomeContent } = await importHomeContent()
    render(<HomeContent allPosts={mockPosts} featuredTags={mockTags} />)
    expect(screen.queryByTestId('word-filtered-posts')).not.toBeInTheDocument()
  })

  it('shows FilteredPostGrid when posts exist', async () => {
    const { HomeContent } = await importHomeContent()
    render(<HomeContent allPosts={mockPosts} featuredTags={mockTags} />)
    expect(screen.getByTestId('filtered-post-grid')).toBeInTheDocument()
  })

  it('hides FilteredPostGrid when posts array is empty', async () => {
    const { HomeContent } = await importHomeContent()
    render(<HomeContent allPosts={[]} featuredTags={mockTags} />)
    expect(screen.queryByTestId('filtered-post-grid')).not.toBeInTheDocument()
  })

  it('updates route on tag select via router.replace', async () => {
    const { HomeContent } = await importHomeContent()
    render(<HomeContent allPosts={mockPosts} featuredTags={mockTags} />)

    fireEvent.click(screen.getByTestId('tag-select-btn'))

    expect(mockReplace).toHaveBeenCalledWith('/?tag=aws', { scroll: false })
  })

  it('removes tag param and deletes page param when "Everything" selected', async () => {
    // Simulate having a current tag selected
    mockSearchParamsGet.mockImplementation((key: string) => (key === 'tag' ? 'aws' : null))
    mockSearchParamsToString.mockReturnValue('tag=aws')
    const { HomeContent } = await importHomeContent()
    render(<HomeContent allPosts={mockPosts} featuredTags={mockTags} />)

    // Click hero word change which calls handleTagSelect('Everything')
    fireEvent.click(screen.getByTestId('hero-word-change'))

    // Should call replace with URL that has no tag param and deleted page param
    expect(mockReplace).toHaveBeenCalledWith('/?', { scroll: false })
  })

  it('resets heroWord to "software" when selecting a tag', async () => {
    const { HomeContent } = await importHomeContent()
    render(<HomeContent allPosts={mockPosts} featuredTags={mockTags} />)

    // First change hero word to something else
    fireEvent.click(screen.getByTestId('hero-word-change'))
    expect(screen.getByTestId('hero-word').textContent).toBe('cloud')

    // Then select a tag — hero word should reset to 'software'
    fireEvent.click(screen.getByTestId('tag-select-btn'))
    expect(screen.getByTestId('hero-word').textContent).toBe('software')
  })
})
