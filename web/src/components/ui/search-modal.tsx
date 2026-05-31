'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import type { SearchItem } from '@/types/search'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  searchItems: SearchItem[]
}

function scoreItem(item: SearchItem, query: string): number {
  const q = query.toLowerCase().trim()
  if (!q) return 0
  const title = item.title.toLowerCase()
  const desc = item.description.toLowerCase()

  let score = 0
  if (title === q) score += 10
  else if (title.startsWith(q)) score += 7
  else if (title.includes(q)) score += 5

  const tagMatch = item.tags.some((t) => t.toLowerCase() === q)
  if (tagMatch) score += 4

  if (desc.includes(q)) score += 1
  return score
}

export function SearchModal({ isOpen, onClose, searchItems }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchItem[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const handleSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([])
        setActiveIndex(0)
        return
      }

      const q = searchQuery.toLowerCase().trim()
      const scored = searchItems
        .map((item) => ({ item, score: scoreItem(item, q) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)

      setResults(scored.map(({ item }) => item))
      setActiveIndex(0)
    },
    [searchItems]
  )

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Global keyboard: Escape, Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return
    const activeEl = listRef.current.querySelector(`[data-search-index="${activeIndex}"]`)
    if (activeEl instanceof HTMLElement) {
      activeEl.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((prev) => Math.min(results.length - 1, prev + 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((prev) => Math.max(0, prev - 1))
        break
      case 'Enter':
        if (e.nativeEvent.isComposing) return
        if (results.length > 0) {
          e.preventDefault()
          const target = results[activeIndex]
          if (target) {
            onClose()
            // Use setTimeout so modal unmounts before navigation
            window.location.href = target.href
          }
        }
        break
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Search">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-on-background/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative max-w-2xl mx-auto mt-20 mx-4">
        <div className="bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/20">
          {/* Search Input */}
          <div className="flex items-center gap-4 p-4 border-b border-outline-variant/20">
            <SearchIcon className="w-5 h-5 text-on-surface-variant shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search posts & projects..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                handleSearch(e.target.value)
              }}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none font-headline"
              role="combobox"
              aria-expanded={results.length > 0}
              aria-activedescendant={results.length > 0 ? `result-${activeIndex}` : undefined}
              aria-controls="search-results"
              aria-autocomplete="list"
              autoComplete="off"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-on-surface-variant bg-surface-container rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div
            id="search-results"
            ref={listRef}
            className="max-h-96 overflow-y-auto"
            role="listbox"
          >
            {query && results.length === 0 && (
              <div className="p-8 text-center text-on-surface-variant" role="status">
                No results found for &quot;{query}&quot;
              </div>
            )}

            {results.map((item, index) => (
              <Link
                key={`${item.type}-${item.slug}`}
                href={item.href}
                onClick={onClose}
                data-search-index={index}
                id={`result-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                className={`block p-4 transition-colors border-b border-outline-variant/10 last:border-0 ${
                  index === activeIndex
                    ? 'bg-primary-container/30'
                    : 'hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-headline font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      item.type === 'post'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-tertiary-container text-on-tertiary-container'
                    }`}
                  >
                    {item.type}
                  </span>
                  <span className="text-xs text-on-surface-variant font-headline">
                    {item.dateOrYear}
                  </span>
                </div>
                <h3 className="font-headline font-bold text-on-surface mb-1">{item.title}</h3>
                <p className="text-sm text-on-surface-variant line-clamp-2">{item.description}</p>
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 bg-surface-container text-on-surface rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 4 && (
                      <span className="text-xs text-on-surface-variant">
                        +{item.tags.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            ))}

            {!query && (
              <div className="p-8 text-center text-on-surface-variant">
                <p className="mb-2">Start typing to search posts & projects</p>
                <p className="text-sm">
                  Press{' '}
                  <kbd className="px-1.5 py-0.5 text-xs bg-surface-container rounded">Cmd</kbd> +{' '}
                  <kbd className="px-1.5 py-0.5 text-xs bg-surface-container rounded">K</kbd> to
                  open search anytime
                </p>
              </div>
            )}
          </div>
        </div>
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
