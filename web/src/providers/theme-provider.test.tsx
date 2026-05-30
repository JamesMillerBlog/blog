import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { ThemeProvider, useTheme } from './theme-provider'

// Helper to access theme values
function TestConsumer() {
  const { theme, toggleTheme } = useTheme()
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button data-testid="toggle-btn" onClick={toggleTheme}>
        Toggle
      </button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('renders children', () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Hello</div>
      </ThemeProvider>
    )
    expect(screen.getByTestId('child')).toHaveTextContent('Hello')
  })

  it('defaults to light theme when nothing stored', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
  })

  it('reads theme from localStorage on mount', () => {
    localStorage.setItem('theme', 'dark')
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )
    // After hydration, the stored theme should be used
    // The first render shows 'light' then useEffect updates
    // We use act to flush effects
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
  })

  it('applies dark class to documentElement when dark', () => {
    localStorage.setItem('theme', 'dark')
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('removes dark class when light', () => {
    localStorage.setItem('theme', 'light')
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('toggleTheme swaps between light and dark', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )
    const btn = screen.getByTestId('toggle-btn')

    await user.click(btn)
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('theme')).toBe('dark')

    await user.click(btn)
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('persists theme to localStorage on toggle', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )

    await user.click(screen.getByTestId('toggle-btn'))
    expect(localStorage.getItem('theme')).toBe('dark')

    await user.click(screen.getByTestId('toggle-btn'))
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('useTheme throws when used outside ThemeProvider', () => {
    // Suppress the expected error in console
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer />)).toThrow('useTheme must be used within a ThemeProvider')
    spy.mockRestore()
  })
})
