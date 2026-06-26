import { useState, useCallback, useMemo } from 'react'
import Fuse from 'fuse.js'
import type { SearchItem } from '@/types/search'

const SYNONYM_MAP: Record<string, string[]> = {
  ai: ['artificial intelligence', 'machine learning', 'ml', 'neural'],
  xr: ['extended reality', 'webxr', 'vr', 'ar', 'quest'],
  serverless: ['lambda', 'aws lambda', 'cloud functions'],
  ml: ['machine learning', 'artificial intelligence', 'ai', 'neural'],
  vr: ['virtual reality', 'extended reality', 'xr', 'ar'],
  ar: ['augmented reality', 'extended reality', 'xr', 'vr'],
  iot: ['internet of things', 'connected devices', 'embedded'],
}

const expandQuery = (query: string): string[] => {
  const lower = query.toLowerCase().trim()
  const synonyms = SYNONYM_MAP[lower]
  if (!synonyms || synonyms.length === 0) return [query]
  return [query, ...synonyms]
}

export const useSearch = (items: SearchItem[]) => {
  const [results, setResults] = useState<SearchItem[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: [
          { name: 'title', weight: 3 },
          { name: 'description', weight: 2 },
          { name: 'tags', weight: 1.5 },
        ],
        threshold: 0.4,
        includeScore: true,
        minMatchCharLength: 1,
      }),
    [items]
  )

  const handleSearch = useCallback(
    (searchQuery: string) => {
      const trimmed = searchQuery.trim()
      if (!trimmed) {
        setResults([])
        setActiveIndex(-1)
        return
      }

      const queries = expandQuery(trimmed)
      const seen = new Set<string>()
      const merged: SearchItem[] = []
      for (const q of queries) {
        const fuseResults = fuse.search(q)
        for (const r of fuseResults) {
          const key = `${r.item.type}-${r.item.slug}`
          if (!seen.has(key)) {
            seen.add(key)
            merged.push(r.item)
          }
        }
      }
      setResults(merged.slice(0, 8))
      setActiveIndex(merged.length > 0 ? 0 : -1)
    },
    [fuse]
  )

  return { results, activeIndex, setActiveIndex, handleSearch }
}
