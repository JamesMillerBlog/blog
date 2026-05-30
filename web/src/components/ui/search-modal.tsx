'use client'

/**
 * ## Future Improvements (not implemented — frontend only)
 *
 * ### Semantic / Intent-Based Search
 * Currently uses token-based relevance scoring (exact/partial word match on title,
 * description, tags). To add intent-based matching without a backend:
 * - Ship a small embeddings model (e.g. all-MiniLM-L6-v2 via transformers.js) to compute
 *   cosine similarity between query and post content client-side. Trade-off: ~80MB model
 *   download.
 * - Alternatively: build a JSON search index at build time (pre-compute word vectors,
 *   synonyms, stemming) and ship it as a static asset — zero runtime cost.
 * - Best outcome: add a server-side search endpoint (e.g. /api/search?q=…) using a
 *   lightweight vector DB (Pinecone, pgvector) + OpenAI embeddings. This would also
 *   handle typo tolerance, stemming, and true semantic matching.
 *
 * ### Search Analytics (out of scope)
 * To track what users search for:
 * - Add a lightweight /api/search-analytics endpoint that logs query text, result count,
 *   and whether a result was clicked (client-side beacon on navigate). Store in a simple
 *   DB table (DynamoDB or PlanetScale).
 * - Or: use a privacy-respecting analytics tool like Plausible with custom events — call
 *   `plausible('search', { props: { query, results: n } })` on each search.
 * - Avoid: client-side Google Analytics (heavy) or full session recording.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { Post } from '@/types/post'
import { projects, Project } from '@/app/projects/data'

interface SearchModalProps {
  onClose: () => void
  allPosts: Post[]
}

interface SearchResult {
  type: 'post' | 'project'
  slug: string
  title: string
  description: string
  href: string
  tags: string[]
  score: number
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,.#\-—]+/)
    .filter(Boolean)
}

function computeRelevance(
  query: string,
  item: { title: string; description: string; tags?: string[] }
): number {
  if (!query.trim()) return 0

  const qTokens = tokenize(query)
  const titleLower = item.title.toLowerCase()
  const descLower = item.description.toLowerCase()
  const tagsLower = (item.tags ?? []).map((t) => t.toLowerCase())

  let score = 0

  for (const token of qTokens) {
    // Title: exact word match
    const titleTokens = tokenize(item.title)
    if (titleTokens.includes(token)) {
      score += 10
    } else if (titleLower.includes(token)) {
      score += 7
    }

    // Description: exact word match
    const descTokens = tokenize(item.description)
    if (descTokens.includes(token)) {
      score += 5
    } else if (descLower.includes(token)) {
      score += 3
    }

    // Tag match (per token)
    for (const tag of tagsLower) {
      if (tag.includes(token) || token.includes(tag)) {
        score += 4
      }
    }
  }

  // Bonus for full query match in title
  if (titleLower.includes(query.toLowerCase().trim())) {
    score += 5
  }

  return score
}

export function SearchModal({ onClose, allPosts }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [rawHighlightedIndex, setRawHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<Element | null>(null)
  const onCloseRef = useRef(onClose)

  // Keep onClose ref current for the stable global listener effect
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // Build searchable index: visible posts + all projects
  const searchIndex = useMemo<SearchResult[]>(() => {
    const postResults: SearchResult[] = allPosts.map((p) => ({
      type: 'post',
      slug: p.slug,
      title: p.title,
      description: p.excerpt ?? '',
      href: `/posts/${p.slug}`,
      tags: p.tags ?? [],
      score: 0,
    }))

    const projectResults: SearchResult[] = projects.map((p: Project) => ({
      type: 'project',
      slug: p.slug,
      title: p.title,
      description: p.description,
      href: `/projects`,
      tags: p.tags,
      score: 0,
    }))

    return [...postResults, ...projectResults]
  }, [allPosts])

  // Filter + score + sort in real time
  const results = useMemo(() => {
    if (!query.trim()) return []

    const q = query.trim()
    return searchIndex
      .map((item) => ({
        ...item,
        score: computeRelevance(q, item),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
  }, [query, searchIndex])

  const highlightedIndex = Math.min(rawHighlightedIndex, Math.max(results.length - 1, 0))

  const activeId =
    results.length > 0
      ? `search-result-${results[highlightedIndex]?.type}-${results[highlightedIndex]?.slug}`
      : undefined

  // Handle query change: reset highlight since results are changing
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value)
    setRawHighlightedIndex(0)
  }, [])

  // Navigate to highlighted result
  const navigateToHighlighted = useCallback(() => {
    if (results.length === 0) return
    const item = results[highlightedIndex]
    if (!item) return
    onClose()
    // Programmatic navigation for Enter key; clicks use <Link>
    window.location.href = item.href
  }, [results, highlightedIndex, onClose])

  // Keyboard handling
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setRawHighlightedIndex((prev) => Math.min(prev + 1, results.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setRawHighlightedIndex((prev) => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          navigateToHighlighted()
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    },
    [results.length, navigateToHighlighted, onClose]
  )

  // Global Escape / Cmd+K listener + focus restoration
  useEffect(() => {
    const savedTrigger = document.activeElement
    triggerRef.current = savedTrigger

    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onCloseRef.current()
      }
    }

    document.addEventListener('keydown', handleGlobalKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleGlobalKey)
      document.body.style.overflow = ''
      ;(savedTrigger as HTMLElement)?.focus()
    }
  }, [])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return
    const item = listRef.current.children[highlightedIndex] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }, [highlightedIndex])

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Search">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-on-background/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative max-w-2xl mx-auto mt-20 px-4">
        <div className="bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/20">
          {/* Search Input */}
          <div className="flex items-center gap-4 p-4 border-b border-outline-variant/20">
            <SearchIcon className="w-5 h-5 text-on-surface-variant" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search posts & projects..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none font-headline"
              aria-activedescendant={activeId ?? ''}
              aria-label="Search posts and projects"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-on-surface-variant bg-surface-container rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {query && results.length === 0 && (
              <div className="p-8 text-center text-on-surface-variant">
                No posts or projects found for &quot;{query}&quot;
              </div>
            )}

            {results.length > 0 && (
              <div ref={listRef} role="listbox" aria-label="Search results">
                {results.map((item, index) => (
                  <Link
                    key={`${item.type}-${item.slug}`}
                    id={`search-result-${item.type}-${item.slug}`}
                    role="option"
                    aria-selected={index === highlightedIndex}
                    href={item.href}
                    onClick={onClose}
                    onMouseEnter={() => setRawHighlightedIndex(index)}
                    className={`block p-4 transition-colors border-b border-outline-variant/10 last:border-0 ${
                      index === highlightedIndex
                        ? 'bg-secondary-container/60'
                        : 'hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <span
                        className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          item.type === 'post'
                            ? 'bg-primary-container text-on-primary-container'
                            : 'bg-tertiary-container text-on-tertiary-container'
                        }`}
                      >
                        {item.type === 'post' ? 'Post' : 'Project'}
                      </span>
                      <h3 className="font-headline font-bold text-on-surface">{item.title}</h3>
                    </div>
                    <p className="text-sm text-on-surface-variant line-clamp-1 ml-0">
                      {item.description}
                    </p>
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}

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
