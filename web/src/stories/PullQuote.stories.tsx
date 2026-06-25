import type { Meta, StoryObj } from '@storybook/react'
import { PullQuote } from '@/components/mdx/pull-quote'

const meta: Meta<typeof PullQuote> = {
  title: 'MDX/PullQuote',
  component: PullQuote,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof PullQuote>

export const Default: Story = {
  args: {
    children:
      'The web platform has always moved forward by accumulating power. Each addition makes more things possible.',
  },
}

export const WithAuthor: Story = {
  args: {
    children:
      'Simplicity is a great virtue but it requires hard work to achieve it and education to appreciate it.',
    author: 'Edsger W. Dijkstra',
  },
}
