export interface SearchIndexItem {
  type: 'post' | 'project'
  slug: string
  title: string
  excerpt: string
  url: string
  tags: string[]
}
