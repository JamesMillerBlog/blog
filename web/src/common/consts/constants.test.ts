import { describe, it, expect } from 'vitest'
import {
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_URL,
  TWITTER_HANDLE,
  AUTHOR,
  FEATURED_TAGS,
} from './constants'

describe('constants', () => {
  it('SITE_NAME is a non-empty string', () => {
    expect(typeof SITE_NAME).toBe('string')
    expect(SITE_NAME.length).toBeGreaterThan(0)
  })

  it('SITE_DESCRIPTION is a non-empty string', () => {
    expect(typeof SITE_DESCRIPTION).toBe('string')
    expect(SITE_DESCRIPTION.length).toBeGreaterThan(0)
  })

  it('SITE_URL is a valid URL string', () => {
    expect(typeof SITE_URL).toBe('string')
    expect(SITE_URL).toMatch(/^https?:\/\//)
  })

  it('TWITTER_HANDLE starts with @', () => {
    expect(TWITTER_HANDLE).toMatch(/^@/)
  })

  it('AUTHOR has name, url, and twitter fields', () => {
    expect(typeof AUTHOR.name).toBe('string')
    expect(typeof AUTHOR.url).toBe('string')
    expect(typeof AUTHOR.twitter).toBe('string')
    expect(AUTHOR.twitter).toMatch(/^@/)
  })

  it('AUTHOR.url is a valid URL', () => {
    expect(AUTHOR.url).toMatch(/^https?:\/\//)
  })

  it('FEATURED_TAGS is a non-empty array of strings', () => {
    expect(Array.isArray(FEATURED_TAGS)).toBe(true)
    expect(FEATURED_TAGS.length).toBeGreaterThan(0)
    FEATURED_TAGS.forEach((tag) => {
      expect(typeof tag).toBe('string')
    })
  })

  it('FEATURED_TAGS has the expected values', () => {
    expect(FEATURED_TAGS).toEqual([
      'Artificial Intelligence',
      'Amazon Web Services',
      'Spacial Computing',
      'DevOps',
      'Blockchain',
      'Front End',
      'Back End',
    ])
  })
})
