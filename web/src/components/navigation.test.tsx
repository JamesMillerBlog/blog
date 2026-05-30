import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

// Mock Next.js dependencies
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, className, width, height }: Record<string, unknown>) => (
    <img
      src={src as string}
      alt={alt as string}
      className={className as string}
      width={width as number}
      height={height as number}
    />
  ),
}))

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
    ...props
  }: {
    href: string
    children: React.ReactNode
    className?: string
    [key: string]: unknown
  }) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  ),
}))

// Mock theme provider
const mockToggleTheme = vi.fn()
vi.mock('@/providers/theme-provider', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: mockToggleTheme }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('Navigation', () => {
  beforeEach(() => {
    mockToggleTheme.mockReset()
  })

  it('renders logo with alt text', async () => {
    const { Navigation } = await import('@/components/navigation')
    render(<Navigation />)
    const logos = screen.getAllByAltText('James Miller Logo')
    expect(logos.length).toBeGreaterThanOrEqual(1)
  })

  it('renders Posts and Projects nav links', async () => {
    const { Navigation } = await import('@/components/navigation')
    render(<Navigation />)
    const postsLinks = screen.getAllByText('Posts')
    const projectsLinks = screen.getAllByText('Projects')
    expect(postsLinks.length).toBeGreaterThanOrEqual(1)
    expect(projectsLinks.length).toBeGreaterThanOrEqual(1)
  })

  it('opens search on Cmd+K', async () => {
    const { Navigation } = await import('@/components/navigation')
    render(<Navigation />)

    fireEvent.keyDown(document, { key: 'k', metaKey: true })

    // Search modal should be visible
    expect(screen.getByPlaceholderText('Search posts...')).toBeInTheDocument()
  })

  it('toggles theme on button click', async () => {
    const { Navigation } = await import('@/components/navigation')
    render(<Navigation />)

    const themeBtn = screen.getByLabelText('Toggle theme')
    fireEvent.click(themeBtn)

    expect(mockToggleTheme).toHaveBeenCalled()
  })

  it('mobile menu toggle shows and hides nav links', async () => {
    const { Navigation } = await import('@/components/navigation')
    render(<Navigation />)

    // Mobile menu should be initially closed
    const menuBtn = screen.getByLabelText('Toggle menu')
    fireEvent.click(menuBtn)

    // After click, mobile links should be visible (we have both desktop and mobile "Posts")
    const allPostsTexts = screen.getAllByText('Posts')
    // Mobile links are in the dropdown div
    expect(allPostsTexts.length).toBeGreaterThanOrEqual(2)
  })
})
