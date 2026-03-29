'use client'

import { useMemo, useState } from 'react'
import { FEATURED_TAG_MAP } from '@/common/consts/constants'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Post } from '@/types/post'
import { ui } from '@/i18n/en'

const PAGE_SIZE = 9

export function FilteredPostGrid({
  posts,
  selectedTag,
  onTagSelect: _onTagSelect,
}: {
  posts: Post[]
  selectedTag: string
  onTagSelect: (tag: string) => void
}) {
  const [page, setPage] = useState(1)
  const [prevTag, setPrevTag] = useState(selectedTag)

  // Reset to page 1 whenever the filter changes (derived state, avoids useEffect)
  if (prevTag !== selectedTag) {
    setPrevTag(selectedTag)
    setPage(1)
  }

  const filteredPosts = useMemo(() => {
    if (selectedTag === 'All') return posts
    const actualTags = FEATURED_TAG_MAP[selectedTag] ?? [selectedTag.toLowerCase()]
    return posts.filter((post) => post.tags?.some((t) => actualTags.includes(t)))
  }, [posts, selectedTag])

  const totalPages = Math.ceil(filteredPosts.length / PAGE_SIZE)
  const pagePosts = filteredPosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <section className="mb-24">
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {pagePosts.map((post) => (
            <motion.div
              key={post.slug}
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-12 text-on-surface-variant font-body">
          {ui.home.postGrid.empty}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
            className="px-4 py-1.5 rounded-full text-sm font-semibold font-headline transition-all duration-300 cursor-pointer text-on-surface-variant hover:text-primary hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-on-surface-variant"
          >
            {ui.home.postGrid.prev}
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`w-9 h-9 rounded-full text-sm font-semibold font-headline transition-all duration-300 cursor-pointer ${
                n === page
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
              }`}
            >
              {n}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages}
            className="px-4 py-1.5 rounded-full text-sm font-semibold font-headline transition-all duration-300 cursor-pointer text-on-surface-variant hover:text-primary hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-on-surface-variant"
          >
            {ui.home.postGrid.next}
          </button>
        </div>
      )}
    </section>
  )
}

function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/posts/${post.slug}`} className="block h-full">
      <article className="group h-full flex flex-col bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/10 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
        {/* Image */}
        <div className="relative h-48 w-full overflow-hidden shrink-0 bg-surface-container-low">
          {post.coverImage && (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          )}
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-grow">
          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {post.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-bold uppercase tracking-wider text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h3 className="font-headline text-lg font-bold text-on-surface mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          <p className="font-body text-on-surface-variant text-sm line-clamp-3 mb-4 flex-grow">
            {post.excerpt}
          </p>
          <span className="text-xs font-semibold text-outline font-headline mt-auto">
            {format(new Date(post.date), 'MMM d, yyyy')}
          </span>
        </div>
      </article>
    </Link>
  )
}
