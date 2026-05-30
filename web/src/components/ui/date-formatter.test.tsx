import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import DateFormatter from './date-formatter'

describe('DateFormatter', () => {
  it('renders a time element with dateTime attribute', () => {
    const { container } = render(<DateFormatter dateString="2024-01-15" />)
    const time = container.querySelector('time')
    expect(time).not.toBeNull()
    expect(time!.getAttribute('dateTime')).toBe('2024-01-15')
  })

  it('formats known date correctly', () => {
    render(<DateFormatter dateString="2024-01-15" />)
    // date-fns format('LLLL\td, yyyy') produces something like "January\t15, 2024"
    expect(screen.getByText(/January/)).toBeInTheDocument()
    expect(screen.getByText(/2024/)).toBeInTheDocument()
  })

  it('handles ISO date strings with time', () => {
    const { container } = render(<DateFormatter dateString="2024-06-01T12:00:00Z" />)
    const time = container.querySelector('time')
    expect(time!.getAttribute('dateTime')).toBe('2024-06-01T12:00:00Z')
  })
})
