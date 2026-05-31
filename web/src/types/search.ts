export type SearchItem = {
  type: 'post' | 'project'
  slug: string
  title: string
  description: string
  tags: string[]
  url: string
  dateOrYear?: string | number
}
