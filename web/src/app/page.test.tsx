import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'

vi.mock('@/common/utils/posts', () => ({
  getAllPosts: vi.fn().mockResolvedValue([
    { slug: 'post-1', title: 'Post 1', date: '2024-01-01', tags: ['aws'] },
    { slug: 'post-2', title: 'Post 2', date: '2024-02-01', tags: ['serverless'] },
  ]),
}))

vi.mock('@/common/consts/constants', () => ({
  FEATURED_TAGS: ['aws', 'serverless', 'typescript'],
  SITE_NAME: 'James Miller',
  SITE_DESCRIPTION: 'Creative Technology Blog',
  SITE_URL: 'https://jamesmiller.blog',
}))

vi.mock('@/app/_components/home-content', () => ({
  HomeContent: ({ allPosts, featuredTags }: { allPosts: unknown[]; featuredTags: string[] }) => (
    <div data-testid="home-content" data-posts={allPosts.length} data-tags={featuredTags.length} />
  ),
}))

describe('Index page', () => {
  it('fetches all posts and passes them to HomeContent', async () => {
    const { default: Index } = await import('./page')
    const { container } = render(await Index())
    const homeContent = container.querySelector('[data-testid="home-content"]')
    expect(homeContent).toBeInTheDocument()
    expect(homeContent?.getAttribute('data-posts')).toBe('2')
    expect(homeContent?.getAttribute('data-tags')).toBe('3')
  })
})
