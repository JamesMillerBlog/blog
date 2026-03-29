'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Post } from '@/types/post'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  posts: Post[]
}

export function SearchModal({ isOpen, onClose, posts }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Post[]>([])

  const handleSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([])
        return
      }

      const q = searchQuery.toLowerCase()
      const filtered = posts.filter(
        (post) => post.title.toLowerCase().includes(q) || post.excerpt.toLowerCase().includes(q)
      )
      setResults(filtered.slice(0, 5))
    },
    [posts]
  )

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
              type="text"
              placeholder="Search posts..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                handleSearch(e.target.value)
              }}
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
                No posts found for &quot;{query}&quot;
              </div>
            )}

            {results.map((post) => (
              <Link
                key={post.slug}
                href={`/posts/${post.slug}`}
                onClick={onClose}
                className="block p-4 hover:bg-surface-container-low transition-colors border-b border-outline-variant/10 last:border-0"
              >
                <h3 className="font-headline font-bold text-on-surface mb-1">{post.title}</h3>
                <p className="text-sm text-on-surface-variant line-clamp-1">{post.excerpt}</p>
              </Link>
            ))}

            {!query && (
              <div className="p-8 text-center text-on-surface-variant">
                <p className="mb-2">Start typing to search posts</p>
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
