import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import React from 'react'

describe('TechIconText', () => {
  it('renders character spans for each letter', async () => {
    const { TechIconText } = await import('./tech-icon-text')
    const { container } = render(<TechIconText>Hi</TechIconText>)
    // "Hi" = 2 chars, each in its own span.inline-block
    const charSpans = container.querySelectorAll('span.inline-block.cursor-pointer ~ span')
    // The outer span contains word spans; verify we have char-level spans
    expect(container.querySelectorAll('span.inline-block[style]').length).toBeGreaterThan(0)
  })

  it('applies className to outer span', async () => {
    const { TechIconText } = await import('./tech-icon-text')
    const { container } = render(<TechIconText className="custom-class">Hello</TechIconText>)
    const outer = container.querySelector('span.inline-block.select-none')
    expect(outer?.className).toContain('custom-class')
  })

  it('calls onHeadingClick when a word span is clicked', async () => {
    const { TechIconText } = await import('./tech-icon-text')
    const onHeadingClick = vi.fn()
    const { container } = render(
      <TechIconText onHeadingClick={onHeadingClick}>Click Me</TechIconText>
    )
    const wordSpan = container.querySelector('span.inline-block.cursor-pointer') as HTMLElement
    expect(wordSpan).not.toBeNull()
    fireEvent.click(wordSpan)
    expect(onHeadingClick).toHaveBeenCalled()
  })

  it('applies secondary color style on character hover', async () => {
    const { TechIconText } = await import('./tech-icon-text')
    const { container } = render(<TechIconText>Hi</TechIconText>)
    // Get the cursor-pointer word span, then find its inner char spans
    const wordSpan = container.querySelector('span.inline-block.cursor-pointer') as HTMLElement
    const charSpans = wordSpan.querySelectorAll('span.inline-block')
    expect(charSpans.length).toBeGreaterThan(0)
    const firstChar = charSpans[0] as HTMLElement
    fireEvent.mouseEnter(firstChar)
    // After hover, the hovered char (index 0) should get secondary color
    expect(firstChar.style.color).toBe('var(--color-secondary)')
  })

  it('clears hover style on mouse leave', async () => {
    const { TechIconText } = await import('./tech-icon-text')
    const { container } = render(<TechIconText>Hi</TechIconText>)
    const wordSpan = container.querySelector('span.inline-block.cursor-pointer') as HTMLElement
    const charSpans = wordSpan.querySelectorAll('span.inline-block')
    const firstChar = charSpans[0] as HTMLElement
    fireEvent.mouseEnter(firstChar)
    fireEvent.mouseLeave(firstChar)
    expect(firstChar.style.color).toBe('')
  })

  it('renders without crashing when no onHeadingClick provided', async () => {
    const { TechIconText } = await import('./tech-icon-text')
    expect(() => render(<TechIconText>Test Text</TechIconText>)).not.toThrow()
  })

  it('renders one cursor-pointer span per word', async () => {
    const { TechIconText } = await import('./tech-icon-text')
    const { container } = render(<TechIconText>One Two Three</TechIconText>)
    const wordSpans = container.querySelectorAll('span.inline-block.cursor-pointer')
    expect(wordSpans.length).toBe(3)
  })

  it('triggers jump animation style on word click', async () => {
    const { TechIconText } = await import('./tech-icon-text')
    const { container } = render(<TechIconText>Jump</TechIconText>)
    const wordSpan = container.querySelector('span.inline-block.cursor-pointer') as HTMLElement
    fireEvent.click(wordSpan)
    // After click, chars should have wordJump animation applied
    const charSpans = wordSpan.querySelectorAll('span.inline-block')
    const firstChar = charSpans[0] as HTMLElement
    expect(firstChar.style.animation).toContain('wordJump')
  })

  it('applies primary color to adjacent char (d=1) when char 0 is hovered', async () => {
    const { TechIconText } = await import('./tech-icon-text')
    const { container } = render(<TechIconText>Hello</TechIconText>)
    const wordSpan = container.querySelector('span.inline-block.cursor-pointer') as HTMLElement
    const charSpans = wordSpan.querySelectorAll('span.inline-block')
    // Hover the first char (index 0) → char at index 1 gets d=1 → primary color
    const firstChar = charSpans[0] as HTMLElement
    const secondChar = charSpans[1] as HTMLElement
    fireEvent.mouseEnter(firstChar)
    expect(secondChar.style.color).toBe('var(--color-primary)')
  })

  it('applies scale(1.03) to char at distance 2 when char 0 is hovered', async () => {
    const { TechIconText } = await import('./tech-icon-text')
    const { container } = render(<TechIconText>Hello</TechIconText>)
    const wordSpan = container.querySelector('span.inline-block.cursor-pointer') as HTMLElement
    const charSpans = wordSpan.querySelectorAll('span.inline-block')
    // Hover the first char (index 0) → char at index 2 gets d=2 → scale(1.03)
    const firstChar = charSpans[0] as HTMLElement
    const thirdChar = charSpans[2] as HTMLElement
    fireEvent.mouseEnter(firstChar)
    expect(thirdChar.style.transform).toBe('scale(1.03)')
  })

  it('returns empty style for chars at distance > 2', async () => {
    const { TechIconText } = await import('./tech-icon-text')
    const { container } = render(<TechIconText>Hello</TechIconText>)
    const wordSpan = container.querySelector('span.inline-block.cursor-pointer') as HTMLElement
    const charSpans = wordSpan.querySelectorAll('span.inline-block')
    // Hover the first char (index 0) → char at index 3+ gets d>=3 → empty style
    const firstChar = charSpans[0] as HTMLElement
    const fourthChar = charSpans[3] as HTMLElement
    fireEvent.mouseEnter(firstChar)
    expect(fourthChar.style.transform).toBe('')
    expect(fourthChar.style.color).toBe('')
  })
})
