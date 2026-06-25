import type { Meta, StoryObj } from '@storybook/react'
import { ProsCons } from '@/components/mdx/pros-cons'

const meta: Meta<typeof ProsCons> = {
  title: 'MDX/ProsCons',
  component: ProsCons,
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof ProsCons>

export const Default: Story = {
  args: {
    pros: [
      'Excellent TypeScript support out of the box',
      'Server Components reduce JavaScript bundle size',
      'Built-in image optimisation and font loading',
    ],
    cons: [
      'Steeper learning curve than traditional React',
      'Server/client boundary can be confusing',
      'Ecosystem still catching up to new patterns',
    ],
  },
}

export const CustomLabels: Story = {
  args: {
    pros: ['Zero runtime overhead', 'Compile-time safety', 'Excellent tooling'],
    cons: ['Verbose syntax', 'Slow compile times on large projects'],
    prosLabel: 'Advantages',
    consLabel: 'Trade-offs',
  },
}
