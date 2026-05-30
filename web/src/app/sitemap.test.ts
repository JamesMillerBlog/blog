import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/common/utils/posts', () => ({
  getAllPosts: vi.fn(),
}))

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('sitemap', () => {
  it('includes home URL with priority 1', async () => {
    const { getAllPosts } = await import('@/common/utils/posts')
    vi.mocked(getAllPosts).mockResolvedValue([])
    const { default: sitemap } = await import('@/app/sitemap')
    const result = await sitemap()

    expect(result).toHaveLength(1)
    expect(result[0].url).toBe('https://jamesmiller.blog')
    expect(result[0].priority).toBe(1)
    expect(result[0].changeFrequency).toBe('weekly')
  })

  it('includes post URLs with correct dates and priority', async () => {
    const { getAllPosts } = await import('@/common/utils/posts')
    vi.mocked(getAllPosts).mockResolvedValue([
      { slug: 'post-one', date: '2024-01-15' },
      { slug: 'post-two', date: '2023-06-01' },
    ] as any)

    const { default: sitemap } = await import('@/app/sitemap')
    const result = await sitemap()

    expect(result).toHaveLength(3)
    expect(result[1].url).toBe('https://jamesmiller.blog/posts/post-one')
    expect(result[1].priority).toBe(0.8)
    expect(result[1].changeFrequency).toBe('monthly')
    expect(new Date(result[1].lastModified!)).toEqual(new Date('2024-01-15'))

    expect(result[2].url).toBe('https://jamesmiller.blog/posts/post-two')
  })

  it('handles empty posts array', async () => {
    const { getAllPosts } = await import('@/common/utils/posts')
    vi.mocked(getAllPosts).mockResolvedValue([])
    const { default: sitemap } = await import('@/app/sitemap')
    const result = await sitemap()

    // Only home URL
    expect(result).toHaveLength(1)
    expect(result[0].url).toBe('https://jamesmiller.blog')
  })
})
