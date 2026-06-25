'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Fuse from 'fuse.js'
import type { SearchItem } from '@/types/search'
import { ui } from '@/i18n/en'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  items: SearchItem[]
}

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

export const SearchModal = ({
  isOpen,
  onClose,
  items,
}: SearchModalProps): React.JSX.Element | null => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchItem[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

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

      // Search with raw query and expanded synonyms, merge best results
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

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [isOpen])

  // Keyboard shortcut: Cmd+K / Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
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

  const navigateToItem = useCallback(
    (item: SearchItem) => {
      onClose()
      router.push(item.url)
    },
    [onClose, router]
  )

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) {
      if (e.key === 'Escape') onClose()
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((prev) => (prev + 1) % results.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((prev) => (prev - 1 + results.length) % results.length)
        break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < results.length) {
          navigateToItem(results[activeIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }

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
        <div className="ds-card shadow-2xl overflow-hidden border border-outline-variant/20">
          {/* Search Input */}
          <div className="flex items-center gap-4 p-4 border-b border-outline-variant/20">
            <SearchIcon className="w-5 h-5 text-on-surface-variant" />
            <input
              ref={inputRef}
              type="text"
              placeholder={ui.search.placeholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                handleSearch(e.target.value)
              }}
              onKeyDown={handleInputKeyDown}
              className="flex-1 bg-transparent text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none font-headline"
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
                {ui.search.noResults(query)}
              </div>
            )}

            {results.map((item, index) => (
              <button
                key={`${item.type}-${item.slug}`}
                onClick={() => navigateToItem(item)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`w-full text-left block p-4 transition-all border-b border-outline-variant/10 last:border-0 ${
                  index === activeIndex ? 'opacity-100' : 'opacity-50 hover:opacity-75'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="ds-type-chip">
                    {item.type === 'post' ? ui.search.posts : ui.search.projects}
                  </span>
                  {item.dateOrYear && (
                    <span className="text-xs text-on-surface-variant font-headline">
                      {typeof item.dateOrYear === 'number'
                        ? item.dateOrYear
                        : new Date(item.dateOrYear).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                          })}
                    </span>
                  )}
                </div>
                <h3 className="font-headline font-bold text-on-surface mb-1">{item.title}</h3>
                <p className="text-sm text-on-surface-variant line-clamp-1">{item.description}</p>
              </button>
            ))}

            {!query && (
              <div className="p-8 text-center text-on-surface-variant">
                <p className="mb-2">{ui.search.empty}</p>
                <p className="text-sm">
                  {ui.search.shortcut}{' '}
                  <kbd className="px-1.5 py-0.5 text-xs bg-surface-container rounded">Cmd</kbd> +{' '}
                  <kbd className="px-1.5 py-0.5 text-xs bg-surface-container rounded">K</kbd>{' '}
                  {ui.search.toOpen}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const SearchIcon = ({ className }: { className?: string }): React.JSX.Element => {
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
