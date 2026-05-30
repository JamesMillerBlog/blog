import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import { JsonLd } from './json-ld'

describe('JsonLd', () => {
  it('renders a script tag with type application/ld+json', () => {
    const { container } = render(
      <JsonLd data={{ '@context': 'https://schema.org', name: 'Test' }} />
    )
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).not.toBeNull()
  })

  it('contains valid JSON of the data prop', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'Test Post',
    }
    const { container } = render(<JsonLd data={data} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    const parsed = JSON.parse(script!.innerHTML)
    expect(parsed).toEqual(data)
  })

  it('handles empty object', () => {
    const { container } = render(<JsonLd data={{}} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    const parsed = JSON.parse(script!.innerHTML)
    expect(parsed).toEqual({})
  })
})
