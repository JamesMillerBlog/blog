'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { Post } from '@/types/post'
import { Project } from '@/app/projects/data'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  posts: Post[]
  projects: Project[]
}

type SearchResult = {
  id: string
  title: string
  excerpt: string
  link: string
  type: 'post' | 'project'
  score: number
}

/** Score a single text field against the query — higher = more relevant */
function scoreField(text: string, query: string): number {
  const t = text.toLowerCase()
  const q = query.toLowerCase()
  if (!q) return 0

  // Exact match
  if (t === q) return 100
  // Starts with
  if (t.startsWith(q)) return 80
  // Contains as whole word
  if (new RegExp(`\\b${escapeRegex(q)}\\b`).test(t)) return 60
  // Contains substring
  if (t.includes(q)) return 40

  // Token-based partial match — each query word found boosts score
  const queryWords = q.split(/\s+/).filter((w) => w.length > 0)
  const textWords = t.split(/\s+/)
  let tokenScore = 0
  for (const qw of queryWords) {
    for (const tw of textWords) {
      if (tw.startsWith(qw)) {
        tokenScore += 20
        break
      }
      if (tw.includes(qw)) {
        tokenScore += 10
        break
      }
    }
  }
  return Math.min(tokenScore, 50)
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function searchItems(posts: Post[], projects: Project[], query: string): SearchResult[] {
  const q = query.trim()
  if (!q) return []

  const results: SearchResult[] = []

  for (const post of posts) {
    let score = 0
    score += scoreField(post.title, q) * 2 // title weight 2x
    score += scoreField(post.excerpt, q)
    // Tag matching bonus
    if (post.tags) {
      for (const tag of post.tags) {
        score += scoreField(tag, q) * 0.5
      }
    }
    if (score > 0) {
      results.push({
        id: `post:${post.slug}`,
        title: post.title,
        excerpt: post.excerpt,
        link: `/posts/${post.slug}`,
        type: 'post',
        score,
      })
    }
  }

  for (const project of projects) {
    let score = 0
    score += scoreField(project.title, q) * 2
    score += scoreField(project.description, q)
    for (const tag of project.tags) {
      score += scoreField(tag, q) * 0.5
    }
    if (score > 0) {
      results.push({
        id: `project:${project.slug}`,
        title: project.title,
        excerpt: project.description,
        link: `/projects#${project.slug}`,
        type: 'project',
        score,
      })
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score)
  return results.slice(0, 8)
}

export function SearchModal({ isOpen, onClose, posts, projects }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => searchItems(posts, projects, query), [posts, projects, query])

  // Clamp selectedIndex to valid range during render (not in effect)
  const clampedIndex = Math.min(selectedIndex, Math.max(0, results.length - 1))

  // Focus input on mount (key-based remount handles open/close reset)
  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return
    const selected = listRef.current.querySelector(`[data-search-index="${clampedIndex}"]`)
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' })
    }
  }, [clampedIndex])

  const navigate = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault()
          setSelectedIndex((prev) => {
            if (results.length === 0) return 0
            return (prev + 1) % results.length
          })
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          setSelectedIndex((prev) => {
            if (results.length === 0) return 0
            return (prev - 1 + results.length) % results.length
          })
          break
        }
        case 'Enter': {
          e.preventDefault()
          if (results.length > 0 && results[clampedIndex]) {
            onClose()
            window.location.href = results[clampedIndex].link
          }
          break
        }
        case 'Escape': {
          e.preventDefault()
          onClose()
          break
        }
      }
    },
    [results, clampedIndex, onClose]
  )

  // Global keyboard handler when modal is open
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K toggles close
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onClose()
        return
      }
      navigate(e)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, navigate, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-on-background/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative max-w-2xl mx-auto mt-20 mx-4">
        <div className="bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/20">
          {/* Search Input */}
          <div className="flex items-center gap-4 p-4 border-b border-outline-variant/20">
            <SearchIcon className="w-5 h-5 text-on-surface-variant" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search posts & projects..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelectedIndex(0)
              }}
              className="flex-1 bg-transparent text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none font-headline"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-on-surface-variant bg-surface-container rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-96 overflow-y-auto">
            {query && results.length === 0 && (
              <div className="p-8 text-center text-on-surface-variant">
                No results found for &quot;{query}&quot;
              </div>
            )}

            {results.map((result, index) => (
              <Link
                key={result.id}
                href={result.link}
                onClick={onClose}
                data-search-index={index}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`block p-4 transition-colors border-b border-outline-variant/10 last:border-0 ${
                  index === clampedIndex
                    ? 'bg-primary-container/40'
                    : 'hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      result.type === 'post'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-tertiary-container text-on-tertiary-container'
                    }`}
                  >
                    {result.type === 'post' ? 'Post' : 'Project'}
                  </span>
                  <h3 className="font-headline font-bold text-on-surface">{result.title}</h3>
                </div>
                <p className="text-sm text-on-surface-variant line-clamp-1 ml-0">
                  {result.excerpt}
                </p>
              </Link>
            ))}

            {!query && (
              <div className="p-8 text-center text-on-surface-variant">
                <p className="mb-2">Start typing to search posts &amp; projects</p>
                <p className="text-sm">
                  Press{' '}
                  <kbd className="px-1.5 py-0.5 text-xs bg-surface-container rounded">Cmd</kbd> +{' '}
                  <kbd className="px-1.5 py-0.5 text-xs bg-surface-container rounded">K</kbd> to
                  open search anytime
                </p>
                <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-surface-container rounded">↑↓</kbd> Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-surface-container rounded">↵</kbd> Open
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-surface-container rounded">Esc</kbd> Close
                  </span>
                </div>
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
