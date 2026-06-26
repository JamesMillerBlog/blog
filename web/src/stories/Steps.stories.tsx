import type { Meta, StoryObj } from '@storybook/react'
import { Steps, Step } from '@/components/mdx/steps'

const meta: Meta<typeof Steps> = {
  title: 'MDX/Steps',
  component: Steps,
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
type Story = StoryObj<typeof Steps>

export const Default: Story = {
  render: () => (
    <Steps>
      <Step>
        <h3 className="font-headline font-bold text-on-surface">Install dependencies</h3>
        <p className="mt-1 text-sm text-on-surface-variant">
          Run pnpm install to get started with the project.
        </p>
      </Step>
      <Step>
        <h3 className="font-headline font-bold text-on-surface">Configure environment</h3>
        <p className="mt-1 text-sm text-on-surface-variant">
          Copy .env.example to .env.local and fill in your values.
        </p>
      </Step>
      <Step>
        <h3 className="font-headline font-bold text-on-surface">Start the dev server</h3>
        <p className="mt-1 text-sm text-on-surface-variant">
          Run pnpm dev and open localhost:3000 in your browser.
        </p>
      </Step>
    </Steps>
  ),
}
