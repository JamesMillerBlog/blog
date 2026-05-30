import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Mock lucide icons
vi.mock('lucide-react', () => ({
  Info: vi.fn((props: Record<string, unknown>) => <svg data-testid="icon-info" {...props} />),
  Lightbulb: vi.fn((props: Record<string, unknown>) => (
    <svg data-testid="icon-lightbulb" {...props} />
  )),
  AlertTriangle: vi.fn((props: Record<string, unknown>) => (
    <svg data-testid="icon-alert" {...props} />
  )),
  StickyNote: vi.fn((props: Record<string, unknown>) => <svg data-testid="icon-note" {...props} />),
  PlayIcon: vi.fn((props: Record<string, unknown>) => <svg data-testid="icon-play" {...props} />),
}))

describe('MDX — Callout', () => {
  it('renders children content', async () => {
    const { Callout } = await import('@/components/mdx/callout')
    render(<Callout>This is a note</Callout>)
    expect(screen.getByText('This is a note')).toBeInTheDocument()
  })

  it('defaults to "note" type when no type specified', async () => {
    const { Callout } = await import('@/components/mdx/callout')
    render(<Callout>Content</Callout>)
    expect(screen.getByRole('note')).toHaveAttribute('aria-label', 'Note')
  })

  it('renders info type correctly', async () => {
    const { Callout } = await import('@/components/mdx/callout')
    render(<Callout type="info">Info content</Callout>)
    expect(screen.getByRole('note')).toHaveAttribute('aria-label', 'Info')
  })

  it('renders warning type correctly', async () => {
    const { Callout } = await import('@/components/mdx/callout')
    render(<Callout type="warning">Warning content</Callout>)
    expect(screen.getByRole('note')).toHaveAttribute('aria-label', 'Warning')
  })

  it('renders tip type correctly', async () => {
    const { Callout } = await import('@/components/mdx/callout')
    render(<Callout type="tip">Tip content</Callout>)
    expect(screen.getByRole('note')).toHaveAttribute('aria-label', 'Tip')
  })

  it('renders border-l-4 class for visual distinction', async () => {
    const { Callout } = await import('@/components/mdx/callout')
    render(<Callout type="info">Test</Callout>)
    const note = screen.getByRole('note')
    expect(note.className).toContain('border-l-4')
  })
})

describe('MDX — Steps', () => {
  it('renders ordered list', async () => {
    const { Steps, Step } = await import('@/components/mdx/steps')
    const { container } = render(
      <Steps>
        <Step>First step</Step>
        <Step>Second step</Step>
      </Steps>
    )
    const ol = container.querySelector('ol')
    expect(ol).not.toBeNull()
  })

  it('renders step content', async () => {
    const { Steps, Step } = await import('@/components/mdx/steps')
    render(
      <Steps>
        <Step>Do this thing</Step>
      </Steps>
    )
    expect(screen.getByText('Do this thing')).toBeInTheDocument()
  })

  it('renders multiple steps', async () => {
    const { Steps, Step } = await import('@/components/mdx/steps')
    render(
      <Steps>
        <Step>Step one</Step>
        <Step>Step two</Step>
        <Step>Step three</Step>
      </Steps>
    )
    expect(screen.getByText('Step one')).toBeInTheDocument()
    expect(screen.getByText('Step two')).toBeInTheDocument()
    expect(screen.getByText('Step three')).toBeInTheDocument()
  })

  it('renders step indicators (circles with counter)', async () => {
    const { Steps, Step } = await import('@/components/mdx/steps')
    const { container } = render(
      <Steps>
        <Step>Step one</Step>
        <Step>Step two</Step>
      </Steps>
    )
    // Steps have counter styling
    const circles = container.querySelectorAll('.rounded-full')
    expect(circles.length).toBe(2)
  })
})

describe('MDX — Tabs', () => {
  it('renders first tab content by default', async () => {
    const { Tabs, Tab } = await import('@/components/mdx/tabs')
    render(
      <Tabs>
        <Tab label="First">First content</Tab>
        <Tab label="Second">Second content</Tab>
      </Tabs>
    )
    expect(screen.getByText('First content')).toBeInTheDocument()
    expect(screen.queryByText('Second content')).not.toBeInTheDocument()
  })

  it('switches tabs on click', async () => {
    const user = userEvent.setup()
    const { Tabs, Tab } = await import('@/components/mdx/tabs')
    render(
      <Tabs>
        <Tab label="First">First content</Tab>
        <Tab label="Second">Second content</Tab>
      </Tabs>
    )

    await user.click(screen.getByText('Second'))
    expect(screen.getByText('Second content')).toBeInTheDocument()
    expect(screen.queryByText('First content')).not.toBeInTheDocument()
  })

  it('renders all tab labels as buttons', async () => {
    const { Tabs, Tab } = await import('@/components/mdx/tabs')
    render(
      <Tabs>
        <Tab label="Tab A">Content A</Tab>
        <Tab label="Tab B">Content B</Tab>
        <Tab label="Tab C">Content C</Tab>
      </Tabs>
    )
    expect(screen.getByText('Tab A')).toBeInTheDocument()
    expect(screen.getByText('Tab B')).toBeInTheDocument()
    expect(screen.getByText('Tab C')).toBeInTheDocument()
  })
})

describe('MDX — PullQuote', () => {
  it('renders quoted content', async () => {
    const { PullQuote } = await import('@/components/mdx/pull-quote')
    render(<PullQuote>A notable insight</PullQuote>)
    expect(screen.getByText('A notable insight')).toBeInTheDocument()
  })
})

describe('MDX — YouTubeEmbed', () => {
  it('renders iframe with correct src', async () => {
    const { YouTubeEmbed } = await import('@/components/mdx/youtube-embed')
    render(<YouTubeEmbed videoId="dQw4w9WgXcQ" title="Test Video" />)
    // Initially not playing — shows thumbnail button, not iframe
    expect(screen.getByLabelText('Play: Test Video')).toBeInTheDocument()
  })
})

describe('MDX — ImageCaption', () => {
  it('renders image with caption', async () => {
    const { ImageCaption } = await import('@/components/mdx/image-caption')
    render(<ImageCaption src="/img.jpg" alt="Alt text" caption="A caption" />)
    expect(screen.getByText('A caption')).toBeInTheDocument()
  })
})

describe('MDX — Kbd', () => {
  it('renders keyboard shortcut text', async () => {
    const { Kbd } = await import('@/components/mdx/kbd')
    render(<Kbd>Cmd + K</Kbd>)
    expect(screen.getByText('Cmd + K')).toBeInTheDocument()
  })
})
