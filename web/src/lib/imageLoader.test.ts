import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ASSETS_BASE_URL } from '@/common/consts/constants'

let imageLoader: typeof import('./imageLoader').default

beforeEach(async () => {
  vi.unstubAllEnvs()
  const mod = await import('./imageLoader')
  imageLoader = mod.default
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('imageLoader', () => {
  describe('external URLs', () => {
    it('passes through https URLs with width param', () => {
      // NODE_ENV is 'test' — not 'development', so it hits production path
      const result = imageLoader({
        src: 'https://example.com/img.jpg',
        width: 800,
      })
      expect(result).toMatch(/^https:\/\/example\.com\/img\.jpg\?w=800/)
    })

    it('appends to existing query string with &', () => {
      const result = imageLoader({
        src: 'https://example.com/img.jpg?q=80',
        width: 400,
      })
      expect(result).toContain('&w=400')
    })
  })

  describe('local paths in development', () => {
    it('returns local path with width only when NODE_ENV=development', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      // Dynamic import picks up the env stub
      const mod = await import('./imageLoader')
      const result = mod.default({ src: '/images/hero.jpg', width: 600 })
      expect(result).toBe('/images/hero.jpg?w=600')
    })
  })

  describe('local paths in production', () => {
    it('returns ASSETS_BASE_URL with width and default quality', () => {
      // NODE_ENV is 'test' — not 'development', so it hits production path
      const result = imageLoader({
        src: '/images/hero.jpg',
        width: 600,
      })
      expect(result).toBe(`${ASSETS_BASE_URL}/images/hero.jpg?w=600&q=75`)
    })

    it('uses custom quality when provided', () => {
      const result = imageLoader({
        src: '/images/hero.jpg',
        width: 600,
        quality: 90,
      })
      expect(result).toBe(`${ASSETS_BASE_URL}/images/hero.jpg?w=600&q=90`)
    })
  })
})
