'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { SearchItem } from '@/types/search'
import { ui } from '@/i18n/en'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  items: SearchItem[]
}

/**
 * Scores a search item against the query for relevance sorting.
 *
 * Scoring tiers:
 * - Exact title match: 100
 * - Title starts with query: 80
 * - Word-boundary title match: 60 per word
 * - Title contains query: 50
 * - Tag match: 40 per word
 * - Description contains query word: 30 per word
 * - Description contains query substring: 20
 *
 * FUTURE ENHANCEMENT (server-side): Replace this scoring with semantic
 * embedding similarity (e.g., OpenAI text-embedding-3-small or a local
 * model) for intent-aware matching. Store embeddings in a vector index
 * (Pinecone, pgvector, or S3 with a precomputed index). This would enable
 * matching "database" → "PostgreSQL", "AI" → "machine learning", etc.
 */
function scoreItem(item: SearchItem, query: string): number {
  const q = query.toLowerCase().trim()
  if (!q) return 0

  const title = item.title.toLowerCase()
  const desc = item.description.toLowerCase()
  const tags = (item.tags ?? []).map((t) => t.toLowerCase())
  const qWords = q.split(/\s+/).filter(Boolean)

  let score = 0

  // Exact title match
  if (title === q) {
    score += 100
  } else if (title.startsWith(q)) {
    score += 80
  } else if (title.includes(q)) {
    score += 50
  }

  // Per-word scoring
  for (const word of qWords) {
    // Word-boundary match in title (bonus)
    const titleWordRe = new RegExp(`\\b${escapeRegex(word)}`, 'i')
    if (titleWordRe.test(title)) {
      score += 60
    }

    // Word in title (already partially covered but catch remaining)
    if (title.includes(word)) {
      score += 10
    }

    // Tag match
    for (const tag of tags) {
      if (tag.includes(word)) {
        score += 40
      }
    }

    // Description word match
    const descWordRe = new RegExp(`\\b${escapeRegex(word)}`, 'i')
    if (descWordRe.test(desc)) {
      score += 30
    } else if (desc.includes(word)) {
      score += 20
    }
  }

  return score
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const MAX_RESULTS = 8

export function SearchModal({ isOpen, onClose, items }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])

  // Compute scored, sorted, limited results
  const results = useMemo(() => {
    if (!query.trim()) return []

    const scored = items
      .map((item) => ({ item, score: scoreItem(item, query) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS)

    return scored.map(({ item }) => item)
  }, [items, query])

  // activeIndex is reset in onChange handler below

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay for animation
      const timer = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Global keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on Escape or Cmd+K when open
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
        return
      }

      if (!isOpen) return

      // Arrow key navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((prev) => {
          const next = prev < results.length - 1 ? prev + 1 : 0
          return next
        })
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((prev) => {
          const next = prev > 0 ? prev - 1 : results.length - 1
          return next
        })
        return
      }
      if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault()
        // Click the active link
        const link = itemRefs.current[activeIndex]
        if (link) {
          link.click()
          onClose()
        }
        return
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
  }, [isOpen, onClose, results.length, activeIndex])

  // Scroll active item into view
  useEffect(() => {
    const el = itemRefs.current[activeIndex]
    if (el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [activeIndex])

  const handleHover = useCallback((index: number) => {
    setActiveIndex(index)
  }, [])

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
              placeholder={ui.search.placeholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActiveIndex(0)
              }}
              className="flex-1 bg-transparent text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none font-headline"
              autoFocus
              aria-activedescendant={
                results.length > 0 ? `search-result-${activeIndex}` : undefined
              }
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls="search-results-list"
              aria-autocomplete="list"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-on-surface-variant bg-surface-container rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div
            ref={listRef}
            className="max-h-96 overflow-y-auto"
            id="search-results-list"
            role="listbox"
          >
            {/* No results */}
            {query && results.length === 0 && (
              <div className="p-8 text-center text-on-surface-variant">
                {ui.search.noResults(query)}
              </div>
            )}

            {/* Results list */}
            {results.map((item, index) => (
              <Link
                key={`${item.type}-${item.slug}`}
                ref={(el) => {
                  itemRefs.current[index] = el
                }}
                href={item.href}
                onClick={onClose}
                onMouseEnter={() => handleHover(index)}
                id={`search-result-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={`block p-4 transition-colors border-b border-outline-variant/10 last:border-0 ${
                  index === activeIndex
                    ? 'bg-secondary-container/60'
                    : 'hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      item.type === 'post'
                        ? 'bg-primary-container text-on-primary-container'
                        : 'bg-tertiary-container text-on-tertiary-container'
                    }`}
                  >
                    {item.type === 'post' ? ui.search.postLabel : ui.search.projectLabel}
                  </span>
                  <h3 className="font-headline font-bold text-on-surface">{item.title}</h3>
                </div>
                <p className="text-sm text-on-surface-variant line-clamp-1 ml-0 pl-0">
                  {item.description}
                </p>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {item.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs text-on-surface-variant/60 bg-surface-container-high px-1.5 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}

            {/* Prompt when empty query */}
            {!query && (
              <div className="p-8 text-center text-on-surface-variant">
                <p className="mb-2">{ui.search.prompt}</p>
                <p className="text-sm">
                  {ui.search.shortcutHint}{' '}
                  <kbd className="px-1.5 py-0.5 text-xs bg-surface-container rounded">Cmd</kbd> +{' '}
                  <kbd className="px-1.5 py-0.5 text-xs bg-surface-container rounded">K</kbd>{' '}
                  {ui.search.toOpen}
                </p>
              </div>
            )}
          </div>

          {/* Footer hint */}
          {results.length > 0 && (
            <div className="px-4 py-2 border-t border-outline-variant/10 text-xs text-on-surface-variant/50 flex gap-4">
              <span>
                <kbd className="px-1 py-0.5 bg-surface-container rounded text-xs">↑↓</kbd> navigate
              </span>
              <span>
                <kbd className="px-1 py-0.5 bg-surface-container rounded text-xs">↵</kbd> select
              </span>
              <span>
                <kbd className="px-1 py-0.5 bg-surface-container rounded text-xs">esc</kbd> close
              </span>
            </div>
          )}
        </div>
      </div>

      {/*
        FUTURE ENHANCEMENTS (server-side):
        ───────────────────────────────────
        1. SEARCH ANALYTICS TRACKING
           Add an API route (e.g., POST /api/search-analytics) that logs
           search queries, selected results, and abandoned searches. Store
           in a simple database (DynamoDB, PlanetScale, or even S3/Athena).
           This lets you:
           - Track popular search terms → inform content strategy
           - Measure "zero-result" rate → identify content gaps
           - See which results people actually click
           Send events from this component via fetch() with debouncing.

           Minimal setup: POST to /api/search-analytics with { query, resultCount, selectedSlug?, timestamp }
           Store as JSONL in S3, query with Athena.

        2. SEMANTIC / INTENT-AWARE SEARCH
           - Generate embeddings for all post/project titles+descriptions
             using OpenAI text-embedding-3-small (or a local model via
             Transformers.js for client-only).
           - Store embeddings in a vector store (Pinecone, pgvector, or
             even a precomputed JSON index in S3).
           - At search time, embed the query and find nearest neighbors
             by cosine similarity.
           - This enables matching "database" → "PostgreSQL", "AI" →
             "machine learning", "building websites" → "React", etc.

        3. SERVER-SIDE SEARCH ENDPOINT
           An API route (GET /api/search?q=...) that performs the full
           search server-side. Benefits:
           - Post content search (search body text, not just titles)
           - Access to ALL posts without shipping all metadata to client
           - Faster for large datasets
           - Can integrate with the analytics and semantic search above.

        4. SEARCH INDEX PRE-BUILD
           During build/SSG, generate a static search-index.json that
           includes pre-computed n-grams, tags, and weighted keywords.
           This makes client-side search faster and more accurate without
           a backend server at runtime.
      */}
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
