import { describe, it, expect, vi } from 'vitest'

// The compileMDXContent function wraps next-mdx-remote/rsc which requires
// the Next.js runtime. We test the rehype plugin logic in isolation and
// verify that the module structure and exports are correct.

describe('mdx module', () => {
  it('exports compileMDXContent function', async () => {
    vi.mock('next-mdx-remote/rsc', () => ({
      compileMDX: vi.fn().mockResolvedValue({ content: null }),
    }))
    const mod = await import('./mdx')
    expect(typeof mod.compileMDXContent).toBe('function')
  })
})

describe('rewriteAssetImageSources (rehype plugin)', () => {
  it('rewrites /assets/ src to ASSETS_BASE_URL in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    // Access the internals via dynamic import to trigger the env check
    const { rewriteAssetImageSources } = await import('./mdx')
    const tree = {
      type: 'root' as const,
      children: [
        {
          type: 'element',
          tagName: 'img',
          properties: { src: '/assets/blog/hero.jpg' },
          children: [],
        },
      ],
    }
    rewriteAssetImageSources()(tree as any)
    const img = tree.children[0] as any
    expect(img.properties.src).toBe('https://assets.jamesmiller.blog/assets/blog/hero.jpg')
    vi.unstubAllEnvs()
  })

  it('does NOT rewrite /assets/ src in development', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { rewriteAssetImageSources } = await import('./mdx')
    const tree = {
      type: 'root' as const,
      children: [
        {
          type: 'element',
          tagName: 'img',
          properties: { src: '/assets/blog/hero.jpg' },
          children: [],
        },
      ],
    }
    rewriteAssetImageSources()(tree as any)
    const img = tree.children[0] as any
    expect(img.properties.src).toBe('/assets/blog/hero.jpg')
    vi.unstubAllEnvs()
  })

  it('does not rewrite non-/assets/ src', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const { rewriteAssetImageSources } = await import('./mdx')
    const tree = {
      type: 'root' as const,
      children: [
        {
          type: 'element',
          tagName: 'img',
          properties: { src: 'https://example.com/img.jpg' },
          children: [],
        },
      ],
    }
    rewriteAssetImageSources()(tree as any)
    const img = tree.children[0] as any
    expect(img.properties.src).toBe('https://example.com/img.jpg')
    vi.unstubAllEnvs()
  })

  it('ignores non-img elements', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const { rewriteAssetImageSources } = await import('./mdx')
    const tree = {
      type: 'root' as const,
      children: [
        {
          type: 'element',
          tagName: 'a',
          properties: { href: '/assets/file.pdf' },
          children: [],
        },
      ],
    }
    rewriteAssetImageSources()(tree as any)
    const link = tree.children[0] as any
    expect(link.properties.href).toBe('/assets/file.pdf')
    vi.unstubAllEnvs()
  })

  it('does not mutate img elements without src', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const { rewriteAssetImageSources } = await import('./mdx')
    const tree = {
      type: 'root' as const,
      children: [
        {
          type: 'element',
          tagName: 'img',
          properties: { alt: 'No src' },
          children: [],
        },
      ],
    }
    expect(() => rewriteAssetImageSources()(tree as any)).not.toThrow()
    vi.unstubAllEnvs()
  })
})
