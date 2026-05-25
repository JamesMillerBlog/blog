import { NextResponse } from 'next/server'
import { getAllPosts, isPostVisible } from '@/common/utils/posts'
import { projects } from '@/app/projects/data'

export interface SearchResultItem {
  type: 'post' | 'project'
  title: string
  slug: string
  excerpt: string
  date?: string
  tags: string[]
  href: string
}

export async function GET() {
  const allPosts = await getAllPosts()
  const visiblePosts = allPosts.filter(isPostVisible)

  const postResults: SearchResultItem[] = visiblePosts.map((post) => ({
    type: 'post',
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? '',
    date: post.date,
    tags: post.tags ?? [],
    href: `/posts/${post.slug}`,
  }))

  const projectResults: SearchResultItem[] = projects
    .filter((p) => p.portfolio !== false)
    .map((p) => ({
      type: 'project',
      title: p.title,
      slug: p.slug,
      excerpt: p.description,
      date: `${p.year}`,
      tags: p.tags,
      href: `/projects#${p.slug}`,
    }))

  return NextResponse.json([...postResults, ...projectResults])
}
