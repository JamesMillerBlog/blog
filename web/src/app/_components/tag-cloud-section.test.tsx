import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

vi.mock('@/components/ui/tech-icon-text', () => ({
  TechIconText: ({
    children,
    onHeadingClick,
  }: {
    children: string
    onHeadingClick?: () => void
  }) => (
    <span data-testid="tech-icon-text" onClick={onHeadingClick}>
      {children}
    </span>
  ),
}))

import type { Post } from '@/types/post'

const makePost = (overrides: Partial<Post> = {}): Post => ({
  slug: 'test-post',
  title: 'Test Post',
  date: '2024-01-15',
  coverImage: '/cover.jpg',
  author: { name: 'James', picture: '/pic.jpg' },
  excerpt: 'Test excerpt',
  ogImage: { url: '/og.jpg' },
  content: 'Content',
  tags: ['react'],
  ...overrides,
})

describe('TagCloudSection', () => {
  it('renders the heading text', async () => {
    const { TagCloudSection } = await import('./tag-cloud-section')
    render(
      <TagCloudSection
        tags={['Artificial Intelligence', 'DevOps']}
        posts={[makePost()]}
        selectedTag="Everything"
        onTagSelect={vi.fn()}
      />
    )
    expect(screen.getByTestId('tech-icon-text')).toHaveTextContent('What are you curious about?')
  })

  it('renders "Everything" tag plus all provided tags', async () => {
    const { TagCloudSection } = await import('./tag-cloud-section')
    render(
      <TagCloudSection
        tags={['Artificial Intelligence', 'DevOps']}
        posts={[makePost()]}
        selectedTag="Everything"
        onTagSelect={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'Everything' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Artificial Intelligence' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'DevOps' })).toBeInTheDocument()
  })

  it('calls onTagSelect when a tag button is clicked', async () => {
    const { TagCloudSection } = await import('./tag-cloud-section')
    const onTagSelect = vi.fn()
    render(
      <TagCloudSection
        tags={['Artificial Intelligence']}
        posts={[makePost()]}
        selectedTag="Everything"
        onTagSelect={onTagSelect}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Artificial Intelligence' }))
    expect(onTagSelect).toHaveBeenCalledWith('Artificial Intelligence')
  })

  it('deselects a tag (back to Everything) when selected tag is clicked again', async () => {
    const { TagCloudSection } = await import('./tag-cloud-section')
    const onTagSelect = vi.fn()
    render(
      <TagCloudSection
        tags={['DevOps']}
        posts={[makePost()]}
        selectedTag="DevOps"
        onTagSelect={onTagSelect}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'DevOps' }))
    expect(onTagSelect).toHaveBeenCalledWith('Everything')
  })

  it('applies selected styling to the active tag', async () => {
    const { TagCloudSection } = await import('./tag-cloud-section')
    render(
      <TagCloudSection
        tags={['DevOps']}
        posts={[makePost()]}
        selectedTag="DevOps"
        onTagSelect={vi.fn()}
      />
    )
    const btn = screen.getByRole('button', { name: 'DevOps' })
    expect(btn.className).toContain('bg-secondary-container')
  })

  it('calls onTagSelect when heading is clicked (random tag selection)', async () => {
    const { TagCloudSection } = await import('./tag-cloud-section')
    const onTagSelect = vi.fn()
    render(
      <TagCloudSection
        tags={['Artificial Intelligence', 'DevOps']}
        posts={[makePost()]}
        selectedTag="Everything"
        onTagSelect={onTagSelect}
      />
    )
    fireEvent.click(screen.getByTestId('tech-icon-text'))
    expect(onTagSelect).toHaveBeenCalled()
  })

  it('renders particle elements after heading click timeout', async () => {
    const { TagCloudSection } = await import('./tag-cloud-section')
    const onTagSelect = vi.fn()
    const { container } = render(
      <TagCloudSection
        tags={['Artificial Intelligence', 'DevOps']}
        posts={[makePost()]}
        selectedTag="Everything"
        onTagSelect={onTagSelect}
      />
    )

    fireEvent.click(screen.getByTestId('tech-icon-text'))

    // Wait for the 150ms timeout that creates particles
    await vi.waitFor(
      () => {
        // Particles are absolutely positioned spans inside the section
        const section = container.querySelector('section')!
        const absoluteSpans = Array.from(section.querySelectorAll('span')).filter(
          (s) =>
            s.getAttribute('style')?.includes('position: absolute') ||
            (s as HTMLElement).style?.position === 'absolute'
        )
        expect(absoluteSpans.length).toBeGreaterThan(0)
      },
      { timeout: 500 }
    )
  })

  it('applies flashing ring to selected tag after heading click', async () => {
    const { TagCloudSection } = await import('./tag-cloud-section')
    const onTagSelect = vi.fn()
    render(
      <TagCloudSection
        tags={['Artificial Intelligence', 'DevOps']}
        posts={[makePost()]}
        selectedTag="Everything"
        onTagSelect={onTagSelect}
      />
    )

    fireEvent.click(screen.getByTestId('tech-icon-text'))

    await vi.waitFor(
      () => {
        // After timeout, flashingTag is set - a button should have scale-110
        const buttons = screen.getAllByRole('button')
        const flashingBtn = buttons.find((b) => b.className.includes('scale-110'))
        expect(flashingBtn).not.toBeUndefined()
      },
      { timeout: 500 }
    )
  })

  it('early-returns in flashTimer when randomTag has no DOM ref (el is null)', async () => {
    const { TagCloudSection } = await import('./tag-cloud-section')
    const onTagSelect = vi.fn()
    // With tags=['Only'] and selectedTag='Only', available=[] so randomTag=undefined
    // tagRefs.current[undefined] is null → hits the !el guard on line 81-82
    render(
      <TagCloudSection
        tags={['Only']}
        posts={[makePost()]}
        selectedTag="Only"
        onTagSelect={onTagSelect}
      />
    )

    fireEvent.click(screen.getByTestId('tech-icon-text'))

    // Advance timers past the 150ms flash timeout - should not throw
    await new Promise((r) => setTimeout(r, 200))
    // onTagSelect was called with undefined (randomTag), no crash
    expect(onTagSelect).toHaveBeenCalled()
  })
})
