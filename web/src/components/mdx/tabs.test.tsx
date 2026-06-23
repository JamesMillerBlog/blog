import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('Tabs', () => {
  it('renders first tab content by default', async () => {
    const { Tabs, Tab } = await import('./tabs')
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
    const { Tabs, Tab } = await import('./tabs')
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
    const { Tabs, Tab } = await import('./tabs')
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

  it('handles single child (non-array)', async () => {
    const { Tabs, Tab } = await import('./tabs')
    render(
      <Tabs>
        <Tab label="Only Tab">Only content</Tab>
      </Tabs>
    )
    expect(screen.getByText('Only Tab')).toBeInTheDocument()
    expect(screen.getByText('Only content')).toBeInTheDocument()
  })
})
