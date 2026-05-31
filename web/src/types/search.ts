export interface SearchItem {
  type: 'post' | 'project'
  slug: string
  href: string
  title: string
  description: string
  tags: string[]
  dateOrYear?: string | number
}
