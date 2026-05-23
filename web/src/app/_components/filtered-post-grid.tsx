'use client'

import { useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FEATURED_TAG_MAP } from '@/common/consts/constants'
import { motion, AnimatePresence } from 'framer-motion'
import { Post } from '@/types/post'
import { ui } from '@/i18n/en'
import { PostCard } from '@/app/_components/post-card'

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const setPage = (n: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (n === 1) {
      params.delete('page')
    } else {
      params.set('page', String(n))
    }
    router.replace(`/?${params.toString()}`, { scroll: false })
  }

  const filteredPosts = useMemo(() => {
    if (selectedTag === 'Everything') return posts
    const actualTags = FEATURED_TAG_MAP[selectedTag] ?? [selectedTag.toLowerCase()]
    return posts.filter((post) => post.tags?.some((t) => actualTags.includes(t)))
  }, [posts, selectedTag])

  const totalPages = Math.ceil(filteredPosts.length / PAGE_SIZE)
  const pagePosts = filteredPosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <section className="mb-24">
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedTag}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={{ animate: { transition: { staggerChildren: 0.06 } } }}
        >
          {pagePosts.map((post) => (
            <motion.div
              key={post.slug}
              variants={{
                initial: { opacity: 0, scale: 0.85, filter: 'blur(6px)' },
                animate: {
                  opacity: 1,
                  scale: 1,
                  filter: 'blur(0px)',
                  transition: { type: 'spring' as const, stiffness: 260, damping: 22 },
                },
                exit: {
                  opacity: 0,
                  scale: 0.9,
                  filter: 'blur(4px)',
                  transition: { duration: 0.15 },
                },
              }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {filteredPosts.length === 0 && (
        <div className="text-center py-12 text-on-surface-variant font-body">
          {ui.home.postGrid.empty}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          <button
            onClick={() => setPage(page - 1)}
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
            onClick={() => setPage(page + 1)}
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
