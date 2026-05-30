import { describe, it, expect } from 'vitest'
import { readingTime } from './reading-time'

describe('readingTime', () => {
  it('returns 1 minute for empty string', () => {
    expect(readingTime('')).toBe(1)
  })

  it('returns 1 minute for whitespace-only string', () => {
    expect(readingTime('   \n\t  ')).toBe(1)
  })

  it('returns 1 minute for a single word', () => {
    expect(readingTime('hello')).toBe(1)
  })

  it('returns 1 minute for exactly 200 words', () => {
    const words = Array(200).fill('word').join(' ')
    expect(readingTime(words)).toBe(1)
  })

  it('returns 2 minutes for 201 words', () => {
    const words = Array(201).fill('word').join(' ')
    expect(readingTime(words)).toBe(2)
  })

  it('returns 5 minutes for 1000 words', () => {
    const words = Array(1000).fill('word').join(' ')
    expect(readingTime(words)).toBe(5)
  })

  it('handles markdown content', () => {
    const md =
      '# Heading\n\nSome **bold** text with [links](https://example.com).\n\n- list item\n- another'
    // 12 words
    expect(readingTime(md)).toBe(1)
  })

  it('handles newlines and extra whitespace', () => {
    expect(readingTime('one\ntwo\n\nthree   four')).toBe(1)
  })
})
