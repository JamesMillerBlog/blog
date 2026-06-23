import { describe, it, expect, vi } from 'vitest'

// Test the metadata contract — verify static metadata shape
vi.mock('@/common/consts/constants', () => ({
  SITE_NAME: 'James Miller',
  SITE_DESCRIPTION: 'Creative Technology Blog',
  SITE_URL: 'https://jamesmiller.blog',
  TWITTER_HANDLE: '@JamesMillerBlog',
  PRODUCTION_ENVIRONMENT: 'production',
  STAGING_ENVIRONMENT: 'staging',
}))

vi.mock('@/common/utils/posts', () => ({
  getAllPosts: vi.fn().mockResolvedValue([]),
}))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getMeta = (mod: any) => mod.metadata

describe('Layout metadata', () => {
  it('exports metadata with correct openGraph config', async () => {
    const mod = await import('./layout')
    const meta = getMeta(mod)
    expect(meta).toBeDefined()
    expect(meta.openGraph).toBeDefined()
    expect(meta.openGraph.type).toBe('website')
    expect(meta.openGraph.siteName).toBe('James Miller')
  })

  it('sets metadataBase from SITE_URL', async () => {
    const mod = await import('./layout')
    const meta = getMeta(mod)
    expect(meta.metadataBase).toBeDefined()
    expect(meta.metadataBase.toString()).toBe('https://jamesmiller.blog/')
  })

  it('exports title template config', async () => {
    const mod = await import('./layout')
    const meta = getMeta(mod)
    expect(meta.title).toBeDefined()
    expect(meta.title.default).toContain('James Miller')
    expect(meta.title.template).toContain('%s')
  })

  it('sets twitter card type', async () => {
    const mod = await import('./layout')
    const meta = getMeta(mod)
    expect(meta.twitter).toBeDefined()
    expect(meta.twitter.card).toBe('summary_large_image')
  })

  it('sets robots indexing', async () => {
    const mod = await import('./layout')
    const meta = getMeta(mod)
    expect(meta.robots.index).toBe(true)
    expect(meta.robots.follow).toBe(true)
  })
})
