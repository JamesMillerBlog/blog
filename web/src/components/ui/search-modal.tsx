'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SearchIndexItem } from '@/types/search'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  items: SearchIndexItem[]
}

function scoreItem(query: string, item: SearchIndexItem): number {
  const q = query.toLowerCase().trim()
  if (!q) return 0

  const title = item.title.toLowerCase()
  const excerpt = item.excerpt.toLowerCase()
  const words = q.split(/\s+/)
  let score = 0

  // Exact title match
  if (title === q) {
    score += 100
  }
  // Title starts with query
  else if (title.startsWith(q)) {
    score += 80
  }

  // Word-level matches in title
  for (const word of words) {
    const titleWords = title.split(/\s+/)
    for (const tw of titleWords) {
      if (tw === word) score += 30
      else if (tw.startsWith(word)) score += 20
      else if (tw.includes(word)) score += 10
    }
  }

  // Word-level matches in excerpt
  for (const word of words) {
    if (excerpt.includes(word)) score += 10
    // Bonus for exact word boundaries in excerpt
    const excerptWords = excerpt.split(/\s+/)
    for (const ew of excerptWords) {
      if (ew === word) score += 5
      else if (ew.startsWith(word)) score += 3
    }
  }

  // Tag matches
  for (const word of words) {
    for (const tag of item.tags) {
      if (tag.toLowerCase() === word) score += 15
      else if (tag.toLowerCase().includes(word)) score += 8
    }
  }

  // Type bonus (posts rank slightly higher than projects)
  if (item.type === 'post') score += 5

  return score
}

function getBestExcerptSnippet(query: string, excerpt: string): string {
  const q = query.toLowerCase().trim()
  if (!q || !excerpt) return excerpt

  const lower = excerpt.toLowerCase()
  const idx = lower.indexOf(q)
  if (idx === -1) return excerpt.length > 120 ? excerpt.slice(0, 120) + '…' : excerpt

  const start = Math.max(0, idx - 40)
  const end = Math.min(excerpt.length, idx + q.length + 60)
  let snippet = excerpt.slice(start, end)
  if (start > 0) snippet = '…' + snippet
  if (end < excerpt.length) snippet = snippet + '…'
  return snippet
}

export function SearchModal({ isOpen, onClose, items }: SearchModalProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchIndexItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const hoveredViaMouse = useRef(false)
  const prevOverflow = useRef<string | null>(null)

  // Focus input on mount (component remounts each time modal opens via key)
  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  const handleSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([])
        setSelectedIndex(0)
        return
      }

      const scored = items
        .map((item) => ({ item, score: scoreItem(searchQuery, item) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ item }) => item)

      setResults(scored.slice(0, 8))
      setSelectedIndex(0)
      hoveredViaMouse.current = false
    },
    [items]
  )

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          onClose()
          break
        case 'ArrowDown':
          e.preventDefault()
          hoveredViaMouse.current = false
          setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
          break
        case 'ArrowUp':
          e.preventDefault()
          hoveredViaMouse.current = false
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
          break
        case 'Enter':
          e.preventDefault()
          if (results.length > 0 && results[selectedIndex]) {
            const targetUrl = results[selectedIndex].url
            if (targetUrl.startsWith('/')) {
              router.push(targetUrl)
            }
            onClose()
          }
          break
        case 'k':
          if ((e.metaKey || e.ctrlKey) && isOpen) {
            e.preventDefault()
            onClose()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, results, selectedIndex, router])

  // Block body scroll when modal open
  useEffect(() => {
    if (isOpen) {
      prevOverflow.current = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    return () => {
      if (prevOverflow.current !== null) {
        document.body.style.overflow = prevOverflow.current
        prevOverflow.current = null
      }
    }
  }, [isOpen])

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return
    const selectedEl = listRef.current.querySelector('[data-selected="true"]')
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Search">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-on-background/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative max-w-2xl mx-auto mt-20 mx-4">
        <div className="bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/20">
          {/* Search Input */}
          <div className="flex items-center gap-4 p-4 border-b border-outline-variant/20">
            <SearchIcon className="w-5 h-5 text-on-surface-variant shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search posts and projects…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                handleSearch(e.target.value)
              }}
              className="flex-1 bg-transparent text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none font-headline"
              autoFocus
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls="search-results"
              aria-activedescendant={
                results.length > 0 ? `search-result-${selectedIndex}` : undefined
              }
              aria-autocomplete="list"
            />
            <div className="hidden sm:flex items-center gap-1">
              <kbd className="inline-flex items-center px-1.5 py-0.5 text-xs font-semibold text-on-surface-variant bg-surface-container rounded">
                ↑↓
              </kbd>
              <span className="text-xs text-on-surface-variant/50">nav</span>
              <kbd className="inline-flex items-center px-1.5 py-0.5 text-xs font-semibold text-on-surface-variant bg-surface-container rounded">
                ↵
              </kbd>
              <span className="text-xs text-on-surface-variant/50">open</span>
            </div>
          </div>

          {/* Results */}
          <div
            ref={listRef}
            id="search-results"
            role="listbox"
            className="max-h-96 overflow-y-auto"
          >
            {query && results.length === 0 && (
              <div className="p-8 text-center text-on-surface-variant">
                <p>No results found for &quot;{query}&quot;</p>
              </div>
            )}

            {results.map((item, index) => (
              <Link
                key={`${item.type}-${item.slug}`}
                href={item.url}
                onClick={onClose}
                id={`search-result-${index}`}
                role="option"
                aria-selected={index === selectedIndex}
                data-selected={index === selectedIndex}
                onMouseEnter={() => {
                  hoveredViaMouse.current = true
                  setSelectedIndex(index)
                }}
                onMouseMove={() => {
                  if (!hoveredViaMouse.current) {
                    hoveredViaMouse.current = true
                    setSelectedIndex(index)
                  }
                }}
                className={`block p-4 transition-colors border-b border-outline-variant/10 last:border-0 ${
                  index === selectedIndex
                    ? 'bg-primary-container/30'
                    : 'hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[0.65rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                      item.type === 'post'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-secondary/10 text-secondary'
                    }`}
                  >
                    {item.type}
                  </span>
                  <h3 className="font-headline font-bold text-on-surface">{item.title}</h3>
                </div>
                <p className="text-sm text-on-surface-variant line-clamp-1 ml-0">
                  {query ? getBestExcerptSnippet(query, item.excerpt) : item.excerpt}
                </p>
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {item.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="text-[0.65rem] text-on-surface-variant/60 bg-surface-container-low px-1.5 py-0.5 rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 4 && (
                      <span className="text-[0.65rem] text-on-surface-variant/40">
                        +{item.tags.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            ))}

            {!query && (
              <div className="p-8 text-center text-on-surface-variant">
                <p className="mb-2 font-headline">Start typing to search</p>
                <p className="text-sm">
                  Search across all posts and projects. Use{' '}
                  <kbd className="px-1.5 py-0.5 text-xs bg-surface-container rounded">↑</kbd>{' '}
                  <kbd className="px-1.5 py-0.5 text-xs bg-surface-container rounded">↓</kbd> to
                  navigate and{' '}
                  <kbd className="px-1.5 py-0.5 text-xs bg-surface-container rounded">↵</kbd> to
                  open.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Keyboard hint footer */}
        {results.length > 0 && (
          <div className="text-center mt-2">
            <span className="text-xs text-on-surface-variant/40">
              <kbd className="px-1 py-0.5 text-[0.65rem] bg-surface-container-lowest/60 rounded">
                esc
              </kbd>{' '}
              to close
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  )
}
