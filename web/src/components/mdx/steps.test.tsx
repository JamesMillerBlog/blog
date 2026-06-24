import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('Steps', () => {
  it('renders step content', async () => {
    const { Steps, Step } = await import('./steps')
    render(
      <Steps>
        <Step>Do this thing</Step>
      </Steps>
    )
    expect(screen.getByText('Do this thing')).toBeInTheDocument()
  })

  it('renders multiple steps', async () => {
    const { Steps, Step } = await import('./steps')
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

  it('renders step number indicators (circles with counter)', async () => {
    const { Steps, Step } = await import('./steps')
    const { container } = render(
      <Steps>
        <Step>Step one</Step>
        <Step>Step two</Step>
      </Steps>
    )
    const circles = container.querySelectorAll('.rounded-full')
    expect(circles.length).toBe(2)
  })

  it('renders as ordered list', async () => {
    const { Steps, Step } = await import('./steps')
    const { container } = render(
      <Steps>
        <Step>A step</Step>
      </Steps>
    )
    expect(container.querySelector('ol')).toBeInTheDocument()
  })
})
