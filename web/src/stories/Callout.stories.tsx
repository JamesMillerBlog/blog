import type { Meta, StoryObj } from '@storybook/react'
import { Callout } from '@/components/mdx/callout'

const meta: Meta<typeof Callout> = {
  title: 'MDX/Callout',
  component: Callout,
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
  argTypes: {
    type: {
      control: 'select',
      options: ['info', 'tip', 'warning', 'note'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Callout>

export const Note: Story = {
  args: {
    type: 'note',
    children: 'This is a neutral note providing supplementary context for the reader.',
  },
}

export const Info: Story = {
  args: {
    type: 'info',
    children: 'This is an informational callout highlighting important details.',
  },
}

export const Tip: Story = {
  args: {
    type: 'tip',
    children: 'Pro tip: use keyboard shortcuts to navigate the Storybook interface faster.',
  },
}

export const Warning: Story = {
  args: {
    type: 'warning',
    children:
      'Warning: this action is irreversible. Make sure you have a backup before proceeding.',
  },
}

export const AllTypes: Story = {
  render: () => (
    <div className="space-y-0">
      <Callout type="note">This is a note with neutral styling.</Callout>
      <Callout type="info">This is an info callout with primary colouring.</Callout>
      <Callout type="tip">This is a tip callout with tertiary colouring.</Callout>
      <Callout type="warning">This is a warning callout with secondary colouring.</Callout>
    </div>
  ),
}
