import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('lucide-react', () => ({
  PlayIcon: vi.fn((props: Record<string, unknown>) => <svg data-testid="icon-play" {...props} />),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, className, fill, ...props }: Record<string, unknown>) => (
    <img
      src={src as string}
      alt={alt as string}
      className={className as string}
      data-fill={fill ? 'true' : 'false'}
      {...props}
    />
  ),
}))

describe('YouTubeEmbed', () => {
  it('renders iframe after clicking play', async () => {
    const { YouTubeEmbed } = await import('./youtube-embed')
    render(<YouTubeEmbed videoId="dQw4w9WgXcQ" />)
    const playButton = screen.getByLabelText('Play video')
    expect(playButton).toBeInTheDocument()

    fireEvent.click(playButton)

    const iframe = screen.getByTitle('YouTube video')
    expect(iframe).toBeInTheDocument()
    expect(iframe.getAttribute('src')).toContain('autoplay=1')
  })

  it('renders thumbnail image initially', async () => {
    const { YouTubeEmbed } = await import('./youtube-embed')
    render(<YouTubeEmbed videoId="dQw4w9WgXcQ" title="Test Video" />)
    expect(screen.getByAltText('Test Video')).toBeInTheDocument()
  })

  it('renders title as figcaption when provided', async () => {
    const { YouTubeEmbed } = await import('./youtube-embed')
    render(<YouTubeEmbed videoId="dQw4w9WgXcQ" title="My Video" />)
    expect(screen.getByText('My Video')).toBeInTheDocument()
  })

  it('uses "YouTube video" as default title when none provided', async () => {
    const { YouTubeEmbed } = await import('./youtube-embed')
    render(<YouTubeEmbed videoId="dQw4w9WgXcQ" />)
    const button = screen.getByLabelText('Play video')
    expect(button).toBeInTheDocument()

    fireEvent.click(button)

    expect(screen.getByTitle('YouTube video')).toBeInTheDocument()
  })

  it('renders with custom title in aria-label', async () => {
    const { YouTubeEmbed } = await import('./youtube-embed')
    render(<YouTubeEmbed videoId="dQw4w9WgXcQ" title="Custom Title" />)
    expect(screen.getByLabelText('Play: Custom Title')).toBeInTheDocument()
  })
})
