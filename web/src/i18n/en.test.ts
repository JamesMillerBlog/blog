import { describe, it, expect } from 'vitest'
import { ui } from './en'

describe('i18n — en', () => {
  it('has expected top-level sections', () => {
    expect(ui).toHaveProperty('nav')
    expect(ui).toHaveProperty('footer')
    expect(ui).toHaveProperty('home')
    expect(ui).toHaveProperty('posts')
    expect(ui).toHaveProperty('projects')
    expect(ui).toHaveProperty('notFound')
  })

  it('nav has all required keys', () => {
    expect(ui.nav).toHaveProperty('posts')
    expect(ui.nav).toHaveProperty('projects')
    expect(ui.nav).toHaveProperty('logoAlt')
    expect(ui.nav).toHaveProperty('searchLabel')
    expect(ui.nav).toHaveProperty('toggleTheme')
    expect(ui.nav).toHaveProperty('toggleMenu')
  })

  it('footer has copyright function and social keys', () => {
    expect(typeof ui.footer.copyright).toBe('function')
    expect(ui.footer.copyright(2024)).toContain('2024')
    expect(ui.footer.social).toHaveProperty('twitter')
    expect(ui.footer.social).toHaveProperty('github')
    expect(ui.footer.social).toHaveProperty('linkedin')
    expect(ui.footer.social).toHaveProperty('rss')
  })

  it('home section has expected keys', () => {
    expect(ui.home.wordPosts.postsAbout).toBeDefined()
    expect(ui.home.tagCloud).toHaveProperty('heading')
    expect(ui.home.postGrid).toHaveProperty('empty')
    expect(ui.home.postGrid).toHaveProperty('prev')
    expect(ui.home.postGrid).toHaveProperty('next')
  })

  it('posts section has expected keys', () => {
    expect(ui.posts).toHaveProperty('backToBlog')
    expect(ui.posts).toHaveProperty('published')
  })

  it('projects section has expected keys', () => {
    expect(ui.projects).toHaveProperty('heading')
    expect(ui.projects).toHaveProperty('description')
    expect(ui.projects).toHaveProperty('empty')
  })

  it('notFound section has expected keys', () => {
    expect(ui.notFound).toHaveProperty('code')
    expect(ui.notFound).toHaveProperty('heading')
    expect(ui.notFound).toHaveProperty('description')
    expect(ui.notFound).toHaveProperty('backHome')
  })

  it('copyright function renders year correctly', () => {
    expect(ui.footer.copyright(2025)).toBe('© 2025 James Miller')
    expect(ui.footer.copyright(1999)).toBe('© 1999 James Miller')
  })

  it('postsAbout function renders word correctly', () => {
    expect(ui.home.wordPosts.postsAbout('AWS')).toBe('Posts about AWS')
    expect(ui.home.wordPosts.postsAbout('React')).toBe('Posts about React')
  })
})
