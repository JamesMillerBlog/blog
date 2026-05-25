'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import type { SearchResultItem } from '@/app/api/search/route'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

function scoreResult(item: SearchResultItem, queryLower: string): number {
  const titleLower = item.title.toLowerCase()
  const excerptLower = item.excerpt.toLowerCase()
  const words = queryLower.split(/\s+/).filter(Boolean)

  let score = 0

  for (const word of words) {
    // Exact title match
    if (titleLower === word) score += 12
    // Title starts with
    else if (titleLower.startsWith(word)) score += 9
    // Word boundary match in title
    else if (new RegExp(`\\b${escapeRegex(word)}`, 'i').test(titleLower)) score += 7
    // Substring in title
    else if (titleLower.includes(word)) score += 5

    // Exact excerpt match
    if (excerptLower === word) score += 6
    // Word boundary match in excerpt
    else if (new RegExp(`\\b${escapeRegex(word)}`, 'i').test(excerptLower)) score += 4
    // Substring in excerpt
    else if (excerptLower.includes(word)) score += 2

    // Tag match
    if (item.tags.some((t) => t.toLowerCase().includes(word))) score += 3
  }

  // Boost posts (primary content)
  if (item.type === 'post') score += 1

  return score
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightMatches(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text

  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => escapeRegex(w))
  if (words.length === 0) return text

  const pattern = new RegExp(`(${words.join('|')})`, 'gi')
  // Non-global test pattern avoids lastIndex drift from split
  const testPattern = new RegExp(`^(${words.join('|')})$`, 'i')
  const parts = text.split(pattern)

  return parts.map((part, i) =>
    testPattern.test(part) ? (
      <mark key={i} className="bg-primary/20 text-primary rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  )
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [allItems, setAllItems] = useState<SearchResultItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<number, HTMLAnchorElement>>(new Map())

  // Fetch search index and focus input on mount
  useEffect(() => {
    fetch('/api/search')
      .then((r) => r.json())
      .then((data: SearchResultItem[]) => setAllItems(data))
      .catch(() => setAllItems([]))
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const scored = allItems
      .filter((item) => {
        const t = item.title.toLowerCase()
        const e = item.excerpt.toLowerCase()
        const words = q.split(/\s+/).filter(Boolean)
        return words.some(
          (w) =>
            t.includes(w) || e.includes(w) || item.tags.some((tag) => tag.toLowerCase().includes(w))
        )
      })
      .map((item) => ({ item, score: scoreResult(item, q) }))
      .filter((s) => s.score > 0)
    scored.sort((a, b) => b.score - a.score)
    return scored.map((s) => s.item)
  }, [query, allItems])

  // Reset selected index when query changes (derived in event handler)

  // Scroll selected item into view
  useEffect(() => {
    const el = itemRefs.current.get(selectedIndex)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1))
          break
        case 'Enter':
          e.preventDefault()
          if (results[selectedIndex]) {
            onClose()
            // Navigate via link click
            itemRefs.current.get(selectedIndex)?.click()
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
        case 'Tab': {
          // Focus trap: cycle through focusable elements within the modal
          const modal = document.querySelector('[role="dialog"][aria-modal="true"]')
          if (!modal) break
          const focusable = modal.querySelectorAll<HTMLElement>(
            'input, a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
          if (focusable.length === 0) break
          const first = focusable[0]
          const last = focusable[focusable.length - 1]
          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault()
              last.focus()
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault()
              first.focus()
            }
          }
          break
        }
      }
    },
    [results, selectedIndex, onClose]
  )

  // Global Escape listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleGlobalKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-on-background/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative max-w-2xl mx-auto mt-20 mx-4">
        <div
          className="bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/20"
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
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
                setSelectedIndex(0)
              }}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none font-headline"
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls="search-results-list"
              aria-activedescendant={
                results.length > 0 ? `search-result-${selectedIndex}` : undefined
              }
              aria-autocomplete="list"
              aria-haspopup="listbox"
              autoComplete="off"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-on-surface-variant bg-surface-container rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div
            ref={listRef}
            className="max-h-96 overflow-y-auto"
            role="listbox"
            id="search-results-list"
          >
            {query && results.length === 0 && (
              <div className="p-8 text-center text-on-surface-variant">
                No results found for &quot;{query}&quot;
              </div>
            )}

            {results.map((item, idx) => (
              <Link
                key={`${item.type}-${item.slug}`}
                href={item.href}
                onClick={onClose}
                ref={(el) => {
                  if (el) itemRefs.current.set(idx, el)
                  else itemRefs.current.delete(idx)
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`block p-4 transition-colors border-b border-outline-variant/10 last:border-0 ${
                  idx === selectedIndex ? 'bg-primary/10' : 'hover:bg-surface-container-low'
                }`}
                role="option"
                aria-selected={idx === selectedIndex}
                id={`search-result-${idx}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-headline font-semibold px-2 py-0.5 rounded-full ${
                      item.type === 'post'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-tertiary-container text-on-tertiary-container'
                    }`}
                  >
                    {item.type === 'post' ? 'Post' : 'Project'}
                  </span>
                  {item.date && (
                    <span className="text-xs text-on-surface-variant font-headline">
                      {item.type === 'post'
                        ? new Date(item.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : item.date}
                    </span>
                  )}
                </div>
                <h3 className="font-headline font-bold text-on-surface mb-1">
                  {highlightMatches(item.title, query)}
                </h3>
                <p className="text-sm text-on-surface-variant line-clamp-1">
                  {highlightMatches(item.excerpt, query)}
                </p>
              </Link>
            ))}

            {!query && (
              <div className="p-8 text-center text-on-surface-variant">
                <p className="mb-2">Start typing to search posts and projects</p>
                <p className="text-sm">
                  Press{' '}
                  <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-surface-container rounded">
                    ↑
                  </kbd>{' '}
                  <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-surface-container rounded">
                    ↓
                  </kbd>{' '}
                  to navigate ·{' '}
                  <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-surface-container rounded">
                    ↵
                  </kbd>{' '}
                  to select ·{' '}
                  <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-surface-container rounded">
                    esc
                  </kbd>{' '}
                  to close
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
