'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { Post } from '@/types/post'
import { projects } from '@/app/projects/data'

interface SearchResult {
  type: 'post' | 'project'
  slug: string
  title: string
  description: string
  href: string
  tags?: string[]
  score: number
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  posts: Post[]
}

/**
 * Relevance scoring:
 * - Title starts with query: +100
 * - Title contains query word: +50
 * - Description contains query word: +20
 * - Tag contains query word: +15
 */
function computeRelevance(
  item: { title: string; description: string; tags?: string[] },
  query: string
): number {
  const q = query.toLowerCase()
  let score = 0

  const words = q.split(/\s+/).filter(Boolean)

  for (const word of words) {
    const titleLower = item.title.toLowerCase()
    if (titleLower.startsWith(word)) {
      score += 100
    } else if (titleLower.includes(word)) {
      score += 50
    }

    if (item.description.toLowerCase().includes(word)) score += 20

    if (item.tags) {
      for (const tag of item.tags) {
        if (tag.toLowerCase().includes(word)) score += 15
      }
    }
  }

  return score
}

export function SearchModal({ isOpen, onClose, posts }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Build unified searchable index
  const searchIndex = useMemo<SearchResult[]>(() => {
    const items: SearchResult[] = [
      ...posts.map((post) => ({
        type: 'post' as const,
        slug: post.slug,
        title: post.title,
        description: post.excerpt,
        href: `/posts/${post.slug}`,
        tags: post.tags,
        score: 0,
      })),
      ...projects.map((project) => ({
        type: 'project' as const,
        slug: project.slug,
        title: project.title,
        description: project.description,
        href: `/projects#${project.slug}`,
        tags: project.tags,
        score: 0,
      })),
    ]
    return items
  }, [posts])

  const results = useMemo(() => {
    const trimmed = query.trim()
    if (!trimmed) return []

    const scored = searchIndex
      .map((item) => ({
        ...item,
        score: computeRelevance(item, trimmed),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)

    return scored.slice(0, 8)
  }, [query, searchIndex])

  // Reset highlightedIndex when results change — handled in onChange below

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && results.length > 0) {
      const el = listRef.current.children[highlightedIndex] as HTMLElement | undefined
      if (el) {
        el.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, results.length])

  // Close handler that also resets internal state
  const handleClose = useCallback(() => {
    setQuery('')
    setHighlightedIndex(0)
    onClose()
  }, [onClose])

  // Keyboard navigation within the input
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
        return
      }
      if (!results.length) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex((prev) => (prev + 1) % results.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex((prev) => (prev - 1 + results.length) % results.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selected = results[highlightedIndex]
        if (selected) {
          handleClose()
          window.location.href = selected.href
        }
      }
    },
    [results, highlightedIndex, handleClose]
  )

  // Global keyboard listeners (Cmd+K, Escape)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleGlobalKeyDown)
      document.body.style.overflow = 'hidden'
      setTimeout(() => inputRef.current?.focus(), 50)
    }

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-on-background/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative max-w-2xl mx-auto mt-20 mx-4">
        <div className="bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/20">
          {/* Search Input */}
          <div className="flex items-center gap-4 p-4 border-b border-outline-variant/20">
            <SearchIcon className="w-5 h-5 text-on-surface-variant flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search posts and projects..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setHighlightedIndex(0)
              }}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none font-headline"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-on-surface-variant bg-surface-container rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-96 overflow-y-auto" role="listbox">
            {query && results.length === 0 && (
              <div className="p-8 text-center text-on-surface-variant">
                <p>No results found for &quot;{query}&quot;</p>
              </div>
            )}

            {results.map((result, index) => (
              <Link
                key={`${result.type}-${result.slug}`}
                href={result.href}
                onClick={handleClose}
                onMouseEnter={() => setHighlightedIndex(index)}
                role="option"
                aria-selected={index === highlightedIndex}
                className={`block p-4 transition-colors border-b border-outline-variant/10 last:border-0 ${
                  index === highlightedIndex
                    ? 'bg-surface-container-low'
                    : 'hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      result.type === 'post'
                        ? 'bg-primary-container text-on-primary-container'
                        : 'bg-secondary-container text-on-secondary-container'
                    }`}
                  >
                    {result.type === 'post' ? 'Post' : 'Project'}
                  </span>
                  {result.tags && result.tags.length > 0 && (
                    <span className="text-xs text-on-surface-variant/60">
                      {result.tags.slice(0, 2).join(', ')}
                    </span>
                  )}
                </div>
                <h3 className="font-headline font-bold text-on-surface mb-0.5">
                  <HighlightMatch text={result.title} query={query} />
                </h3>
                <p className="text-sm text-on-surface-variant line-clamp-1">
                  <HighlightMatch text={result.description} query={query} />
                </p>
              </Link>
            ))}

            {!query && (
              <div className="p-8 text-center text-on-surface-variant">
                <p className="mb-2">Start typing to search posts and projects</p>
                <p className="text-sm">
                  Press{' '}
                  <kbd className="px-1.5 py-0.5 text-xs bg-surface-container rounded">Cmd</kbd> +{' '}
                  <kbd className="px-1.5 py-0.5 text-xs bg-surface-container rounded">K</kbd> to
                  open search anytime
                </p>
              </div>
            )}
          </div>

          {/* Footer with keyboard hints */}
          {results.length > 0 && (
            <div className="flex items-center gap-4 px-4 py-2 border-t border-outline-variant/10 text-xs text-on-surface-variant/60">
              <span>
                <kbd className="px-1 py-0.5 bg-surface-container rounded text-xs">↑↓</kbd> navigate
              </span>
              <span>
                <kbd className="px-1 py-0.5 bg-surface-container rounded text-xs">↵</kbd> select
              </span>
              <span>
                <kbd className="px-1 py-0.5 bg-surface-container rounded text-xs">Esc</kbd> close
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Highlights query matches within text, preserving case.
 */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>

  const words = query
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0)

  if (words.length === 0) return <>{text}</>

  const pattern = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const regex = new RegExp(`(${pattern})`, 'gi')

  const parts = text.split(regex)
  if (parts.length <= 1) return <>{text}</>

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-tertiary-container/40 text-on-tertiary-container rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
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
