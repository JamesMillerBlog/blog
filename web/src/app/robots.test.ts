import { describe, it, expect } from 'vitest'
import robots from '@/app/robots'

describe('robots', () => {
  it('allows all user agents', () => {
    const result = robots()
    expect(result.rules).toBeDefined()

    // Next.js MetadataRoute.Robots rules can be object or array
    const rules = result.rules!
    if (Array.isArray(rules)) {
      expect(rules[0].userAgent).toBe('*')
      expect(rules[0].allow).toBe('/')
    } else {
      expect(rules.userAgent).toBe('*')
      expect(rules.allow).toBe('/')
    }
  })

  it('includes sitemap URL', () => {
    const result = robots()
    expect(result.sitemap).toBe('https://jamesmiller.blog/sitemap.xml')
  })
})
