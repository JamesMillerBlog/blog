import { describe, it, expect, vi, beforeEach } from 'vitest'

const NEXT_NOT_FOUND = new Error('NEXT_NOT_FOUND')

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw NEXT_NOT_FOUND
  }),
}))

const mockPosts = [
  {
    slug: 'visible-post',
    title: 'Visible Post',
    date: '2024-01-15',
    excerpt: 'A visible post excerpt',
    coverImage: '/visible.jpg',
    ogImage: { url: 'https://example.com/og.jpg' },
    content: 'Post content',
    draft: false,
    tags: ['aws'],
    author: { name: 'James Miller', picture: '/author.jpg' },
  },
  {
    slug: 'draft-post',
    title: 'Draft Post',
    date: '2024-06-01',
    excerpt: 'A draft post excerpt',
    coverImage: '/draft.jpg',
    ogImage: { url: 'https://example.com/og-draft.jpg' },
    content: 'Draft content',
    draft: true,
    tags: ['react'],
    author: { name: 'James Miller', picture: '/author.jpg' },
  },
]

vi.mock('@/common/utils/posts', () => ({
  getAllPosts: vi.fn().mockResolvedValue(mockPosts),
  getPostBySlug: vi.fn().mockImplementation((slug: string) => {
    const post = mockPosts.find((p) => p.slug === slug) ?? null
    return Promise.resolve(post)
  }),
  isPostVisible: vi.fn().mockImplementation((post: { draft?: boolean }) => {
    // Mirror the real logic: invisible if draft and not in dev/staging
    return !post.draft
  }),
}))

vi.mock('@/common/utils/mdx', () => ({
  compileMDXContent: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/common/utils/reading-time', () => ({
  readingTime: vi.fn(() => 5),
}))

vi.mock('@/common/consts/constants', () => ({
  SITE_URL: 'https://jamesmiller.blog',
  TWITTER_HANDLE: '@JamesMillerBlog',
  AUTHOR: { name: 'James Miller', url: 'https://jamesmiller.blog' },
}))

vi.mock('@/app/posts/_components/post-body', () => ({
  PostBody: ({ content }: { content: unknown }) => (
    <div data-testid="post-body" data-content={JSON.stringify(content)} />
  ),
}))

vi.mock('@/app/posts/_components/post-header', () => ({
  PostHeader: ({ title }: { title: string }) => <header data-testid="post-header">{title}</header>,
}))

vi.mock('@/app/posts/_components/author-bio', () => ({
  AuthorBio: () => <div data-testid="author-bio" />,
}))

vi.mock('@/app/posts/_components/related-posts', () => ({
  RelatedPosts: ({ posts }: { posts: unknown[] }) => (
    <div data-testid="related-posts" data-count={posts.length} />
  ),
}))

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
  }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => <span data-href={href}>{children}</span>,
}))

vi.mock('@/app/posts/_components/back-button', () => ({
  BackButton: ({ label }: { label: string }) => <span data-testid="back-button">{label}</span>,
}))

vi.mock('@/components/ui/json-ld', () => ({
  JsonLd: ({ data }: { data: Record<string, unknown> }) => (
    <script data-testid="json-ld" data-type={data['@type'] as string} />
  ),
}))

vi.mock('@/i18n/en', () => ({
  ui: {
    posts: { backToBlog: 'Back to blog' },
    nav: {},
    footer: {},
    home: {
      wordPosts: { postsAbout: () => '' },
      tagCloud: { heading: '' },
      postGrid: { empty: '', prev: '', next: '' },
    },
    projects: { heading: '', description: '', empty: '' },
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

describe('Post page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const makeParams = (slug: string): { params: Promise<{ slug: string }> } => ({
    params: Promise.resolve({ slug }),
  })

  describe('generateMetadata', () => {
    it('returns metadata for visible post', async () => {
      const { generateMetadata } = await import('./page')
      const result = await generateMetadata(makeParams('visible-post'))
      expect(result).toBeDefined()
      if (result && 'title' in result) {
        expect(result.title).toBe('Visible Post')
        expect(result.description).toBe('A visible post excerpt')
      }
    })

    it('calls notFound() when post is null (not found)', async () => {
      const { generateMetadata } = await import('./page')
      await expect(generateMetadata(makeParams('nonexistent'))).rejects.toThrow('NEXT_NOT_FOUND')
      const { notFound } = await import('next/navigation')
      expect(notFound).toHaveBeenCalled()
    })

    it('calls notFound() when post is not visible (draft in production)', async () => {
      const { generateMetadata } = await import('./page')
      await expect(generateMetadata(makeParams('draft-post'))).rejects.toThrow('NEXT_NOT_FOUND')
      const { notFound } = await import('next/navigation')
      expect(notFound).toHaveBeenCalled()
    })

    it('includes openGraph metadata with publishedTime', async () => {
      const { generateMetadata } = await import('./page')
      const result = await generateMetadata(makeParams('visible-post'))
      if (result && 'openGraph' in result) {
        const og = result.openGraph as Record<string, unknown>
        expect(og.type).toBe('article')
        expect(og.publishedTime).toBe('2024-01-15')
      }
    })

    it('includes twitter card metadata', async () => {
      const { generateMetadata } = await import('./page')
      const result = await generateMetadata(makeParams('visible-post'))
      if (result && 'twitter' in result) {
        const tw = result.twitter as Record<string, unknown>
        expect(tw.card).toBe('summary_large_image')
      }
    })

    it('sets canonical URL via alternates', async () => {
      const { generateMetadata } = await import('./page')
      const result = await generateMetadata(makeParams('visible-post'))
      if (result && 'alternates' in result) {
        const alt = result.alternates as Record<string, unknown>
        expect(alt.canonical).toBe('https://jamesmiller.blog/posts/visible-post')
      }
    })
  })

  describe('generateStaticParams', () => {
    it('returns slug params for all posts', async () => {
      const { generateStaticParams } = await import('./page')
      const params = await generateStaticParams()
      expect(params).toHaveLength(2)
      expect(params.map((p: { slug: string }) => p.slug)).toEqual(['visible-post', 'draft-post'])
    })
  })

  describe('Post component', () => {
    it('returns notFound when post is null', async () => {
      const { default: Post } = await import('./page')
      await expect(Post(makeParams('nonexistent'))).rejects.toThrow('NEXT_NOT_FOUND')
    })

    it('returns notFound when post is not visible', async () => {
      const { default: Post } = await import('./page')
      await expect(Post(makeParams('draft-post'))).rejects.toThrow('NEXT_NOT_FOUND')
    })

    it('renders post title in header for visible post', async () => {
      const { default: Post } = await import('./page')
      const element = await Post(makeParams('visible-post'))
      const { render } = await import('@testing-library/react')
      const { container } = render(element)
      expect(container.querySelector('[data-testid="post-header"]')).toBeInTheDocument()
    })
  })
})
