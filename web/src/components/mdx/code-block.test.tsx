import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

describe('CodeBlock', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const importCodeBlock = () => import('./code-block').then((m) => m.CodeBlock)

  it('renders code content inside pre', async () => {
    const CodeBlock = await importCodeBlock()
    render(<CodeBlock data-language="ts">const x = 1</CodeBlock>)
    expect(screen.getByText('const x = 1')).toBeInTheDocument()
  })

  it('shows language label from data-language using LANGUAGE_LABELS map', async () => {
    const CodeBlock = await importCodeBlock()
    render(<CodeBlock data-language="ts">code</CodeBlock>)
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })

  it('shows uppercase raw language when not in LANGUAGE_LABELS map', async () => {
    const CodeBlock = await importCodeBlock()
    render(<CodeBlock data-language="zig">code</CodeBlock>)
    expect(screen.getByText('ZIG')).toBeInTheDocument()
  })

  it('shows filename from data-filename instead of language label', async () => {
    const CodeBlock = await importCodeBlock()
    render(
      <CodeBlock data-language="ts" data-filename="app.ts">
        code
      </CodeBlock>
    )
    expect(screen.getByText('app.ts')).toBeInTheDocument()
    expect(screen.queryByText('TypeScript')).not.toBeInTheDocument()
  })

  it('shows no label when neither data-language nor data-filename provided', async () => {
    const CodeBlock = await importCodeBlock()
    render(<CodeBlock>code</CodeBlock>)
    expect(screen.queryByText('Copy')).toBeInTheDocument()
    // No label text rendered — only icons and Copy button
    const spans = screen.queryAllByText(/./)
    const labelTexts = spans.filter((el) => el.className?.includes?.('tracking-wide'))
    expect(labelTexts).toHaveLength(0)
  })

  it('renders copy button with "Copy" text initially', async () => {
    const CodeBlock = await importCodeBlock()
    render(<CodeBlock data-language="ts">code</CodeBlock>)
    expect(screen.getByText('Copy')).toBeInTheDocument()
  })

  it('copies code text and shows "Copied!" on click', async () => {
    const CodeBlock = await importCodeBlock()
    render(
      <CodeBlock data-language="ts">
        <code>console.log(&apos;hello&apos;)</code>
      </CodeBlock>
    )

    fireEvent.click(screen.getByLabelText('Copy code'))

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("console.log('hello')")
    })
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument()
    })
  })

  it('copies empty string when no code element found', async () => {
    const CodeBlock = await importCodeBlock()
    render(<CodeBlock data-language="ts">just text, no code element</CodeBlock>)

    fireEvent.click(screen.getByLabelText('Copy code'))
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('')
    })
  })

  it('renders file icon when filename provided', async () => {
    const CodeBlock = await importCodeBlock()
    const { container } = render(<CodeBlock data-filename="config.yaml">key: value</CodeBlock>)
    // FileIcon renders specific path with d="M9 12h6..."
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThanOrEqual(1)
    // FileIcon has the longer path definition
    const fileSvg = container.querySelector('svg path[d*="M9 12h6"]')
    expect(fileSvg).not.toBeNull()
  })

  it('renders code icon when no filename provided', async () => {
    const CodeBlock = await importCodeBlock()
    const { container } = render(<CodeBlock data-language="python">{`print('hi')`}</CodeBlock>)
    // CodeIcon renders path with d="M17 8l4 4..."
    const codeSvg = container.querySelector('svg path[d*="M17 8"]')
    expect(codeSvg).not.toBeNull()
  })

  it('maps common language aliases correctly', async () => {
    const CodeBlock = await importCodeBlock()
    const cases: [string, string][] = [
      ['js', 'JavaScript'],
      ['javascript', 'JavaScript'],
      ['jsx', 'JSX'],
      ['tsx', 'TSX'],
      ['json', 'JSON'],
      ['html', 'HTML'],
      ['css', 'CSS'],
      ['scss', 'SCSS'],
      ['bash', 'Bash'],
      ['sh', 'Shell'],
      ['shell', 'Shell'],
      ['python', 'Python'],
      ['py', 'Python'],
      ['ruby', 'Ruby'],
      ['go', 'Go'],
      ['rust', 'Rust'],
      ['yaml', 'YAML'],
      ['yml', 'YAML'],
      ['sql', 'SQL'],
      ['dockerfile', 'Dockerfile'],
      ['mdx', 'MDX'],
      ['plaintext', 'Plain text'],
    ]
    for (const [lang, expected] of cases) {
      const { unmount } = render(<CodeBlock data-language={lang}>code</CodeBlock>)
      expect(screen.getByText(expected)).toBeInTheDocument()
      unmount()
    }
  })

  it('resets "Copied!" back to "Copy" after 2 seconds', async () => {
    const CodeBlock = await importCodeBlock()
    render(
      <CodeBlock data-language="ts">
        <code>const x = 1</code>
      </CodeBlock>
    )

    fireEvent.click(screen.getByLabelText('Copy code'))

    // Wait for the clipboard promise + setCopied(true) to settle
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument()
    })

    // Use real timers — advance 2100ms via a real async delay
    await new Promise((r) => setTimeout(r, 2100))

    await waitFor(() => {
      expect(screen.getByText('Copy')).toBeInTheDocument()
    })
  })
})
