import { NextResponse } from 'next/server'
import { getAllPosts } from '@/common/utils/posts'
import { projects } from '@/app/projects/data'
import { SearchIndexItem } from '@/types/search'

export const dynamic = 'force-static'

export async function GET() {
  const posts = await getAllPosts()

  const postItems: SearchIndexItem[] = posts.map((post) => ({
    type: 'post' as const,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt ?? '',
    url: `/posts/${post.slug}`,
    tags: post.tags ?? [],
  }))

  const projectItems: SearchIndexItem[] = projects.map((project) => ({
    type: 'project' as const,
    slug: project.slug,
    title: project.title,
    excerpt: project.description,
    url: `/projects#${project.slug}`,
    tags: project.tags,
  }))

  return NextResponse.json([...postItems, ...projectItems])
}
