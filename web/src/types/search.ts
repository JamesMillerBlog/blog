export interface SearchItem {
  slug: string
  title: string
  description: string
  type: 'post' | 'project'
  href: string
  tags?: string[]
}
