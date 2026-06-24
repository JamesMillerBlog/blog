import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'

describe('FileTree', () => {
  it('renders file tree lines', async () => {
    const { FileTree } = await import('./file-tree')
    const tree = '├── src/\n├── index.ts\n└── README.md'
    const { container } = render(<FileTree>{tree}</FileTree>)
    expect(container.querySelector('pre')).toBeInTheDocument()
    expect(container.textContent).toContain('src/')
    expect(container.textContent).toContain('index.ts')
    expect(container.textContent).toContain('README.md')
  })

  it('colorizes directory tokens with primary class', async () => {
    const { FileTree } = await import('./file-tree')
    const { container } = render(<FileTree>{'src/'}</FileTree>)
    const dirSpan = container.querySelector('.text-primary')
    expect(dirSpan).not.toBeNull()
    expect(dirSpan!.textContent).toBe('src/')
  })

  it('colorizes TypeScript files with secondary class', async () => {
    const { FileTree } = await import('./file-tree')
    const { container } = render(<FileTree>{'app.tsx'}</FileTree>)
    const tsSpan = container.querySelector('.text-secondary')
    expect(tsSpan).not.toBeNull()
    expect(tsSpan!.textContent).toBe('app.tsx')
  })

  it('colorizes MDX files with tertiary class', async () => {
    const { FileTree } = await import('./file-tree')
    const { container } = render(<FileTree>{'post.mdx'}</FileTree>)
    const mdxSpan = container.querySelector('.text-tertiary')
    expect(mdxSpan).not.toBeNull()
    expect(mdxSpan!.textContent).toBe('post.mdx')
  })

  it('renders plain files without special colorization', async () => {
    const { FileTree } = await import('./file-tree')
    const { container } = render(<FileTree>{'config.json'}</FileTree>)
    expect(container.querySelector('.text-primary')).toBeNull()
    expect(container.querySelector('.text-secondary')).toBeNull()
    expect(container.querySelector('.text-tertiary')).toBeNull()
    expect(container.textContent).toContain('config.json')
  })

  it('renders lines that do not match the regex as plain divs', async () => {
    const { FileTree } = await import('./file-tree')
    const { container } = render(<FileTree>{'   '}</FileTree>)
    expect(container.querySelector('pre')).toBeInTheDocument()
  })
})
