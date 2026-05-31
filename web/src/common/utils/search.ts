import { getAllPosts } from '@/common/utils/posts'
import { projects } from '@/app/projects/data'
import type { SearchItem } from '@/types/search'

export async function getAllSearchItems(): Promise<SearchItem[]> {
  const posts = await getAllPosts()

  const postItems: SearchItem[] = posts.map((post) => ({
    type: 'post',
    slug: post.slug,
    href: `/posts/${post.slug}`,
    title: post.title,
    description: post.excerpt,
    tags: post.tags ?? [],
    dateOrYear: post.date,
  }))

  const projectItems: SearchItem[] = projects.map((project) => ({
    type: 'project',
    slug: project.slug,
    href: `/projects#${project.slug}`,
    title: project.title,
    description: project.description,
    tags: project.tags,
    dateOrYear: project.year,
  }))

  return [...postItems, ...projectItems]
}
