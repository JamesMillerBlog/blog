import type { Meta, StoryObj } from '@storybook/react'
import { PostCard } from '@/app/_components/post-card'

const mockPost = {
  slug: 'getting-started-with-nextjs',
  title: 'Getting Started with Next.js App Router',
  excerpt:
    'A comprehensive guide to building modern web applications with the Next.js App Router, Server Components, and the latest React patterns.',
  date: '2024-03-15',
  author: { name: 'James Miller', picture: '/assets/blog/authors/james.jpg' },
  ogImage: { url: '' },
  tags: ['Next.js', 'React'],
  coverImage: '',
  content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(30),
}

const meta: Meta<typeof PostCard> = {
  title: 'Blog/PostCard',
  component: PostCard,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof PostCard>

export const Default: Story = {
  args: {
    post: mockPost,
    variant: 'default',
  },
}

export const Glow: Story = {
  args: {
    post: mockPost,
    variant: 'glow',
  },
}

export const NoCoverImage: Story = {
  args: {
    post: { ...mockPost, coverImage: '' },
  },
}

export const NoTags: Story = {
  args: {
    post: { ...mockPost, tags: [] },
  },
}

export const Grid: Story = {
  decorators: [
    (_Story) => (
      <div className="grid grid-cols-3 gap-6 max-w-4xl">
        <PostCard post={mockPost} />
        <PostCard
          post={{
            ...mockPost,
            slug: '2',
            title: 'Building Design Systems with Tailwind CSS v4',
            tags: ['Design', 'CSS'],
          }}
        />
        <PostCard
          post={{
            ...mockPost,
            slug: '3',
            title: 'TypeScript Patterns for Large Applications',
            tags: ['TypeScript'],
          }}
          variant="glow"
        />
      </div>
    ),
  ],
  render: () => <></>,
}
