import type { Meta, StoryObj } from '@storybook/react'
import { Tabs, Tab } from '@/components/mdx/tabs'

const meta: Meta<typeof Tabs> = {
  title: 'MDX/Tabs',
  component: Tabs,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Tabs>

export const Default: Story = {
  render: () => (
    <Tabs>
      <Tab label="npm">
        <pre className="text-sm text-on-surface">npm install next react react-dom</pre>
      </Tab>
      <Tab label="pnpm">
        <pre className="text-sm text-on-surface">pnpm add next react react-dom</pre>
      </Tab>
      <Tab label="yarn">
        <pre className="text-sm text-on-surface">yarn add next react react-dom</pre>
      </Tab>
    </Tabs>
  ),
}
