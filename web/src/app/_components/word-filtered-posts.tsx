'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Post } from '@/types/post'
import { ui } from '@/i18n/en'
import { PostCard } from '@/app/_components/post-card'

const WORD_TO_TAGS: Record<string, string[]> = {
  software: [],
  websites: [
    'frontend',
    'html',
    'javascript',
    'nextjs',
    'react',
    'threejs',
    'reactthreefiber',
    'r3f',
  ],
  APIs: [
    'node',
    'lambda',
    'serverless',
    'serverlessframework',
    'sls',
    'aws',
    'amazonwebservices',
    'amazoncognito',
  ],
  agents: ['ai', 'machinelearning', 'claudecode', 'deeplearning'],
  infrastructure: [
    'aws',
    'amazonwebservices',
    'terraform',
    'devops',
    'iac',
    'docker',
    'githubactions',
  ],
  experiences: [
    'webxr',
    'webvr',
    'mixedreality',
    'threejs',
    'metaverse',
    'virtualreality',
    'webar',
    'webmr',
    'r3f',
    'reactthreefiber',
  ],
}

const MAX_POSTS = 6

export function WordFilteredPosts({ posts, word }: { posts: Post[]; word: string }) {
  const filtered = useMemo(() => {
    const tags = WORD_TO_TAGS[word] ?? []
    if (tags.length === 0) return []
    return posts.filter((p) => p.tags?.some((t) => tags.includes(t))).slice(0, MAX_POSTS)
  }, [posts, word])

  if (filtered.length === 0) return null

  return (
    <section className="mb-24">
      <AnimatePresence mode="wait">
        <motion.div
          key={word}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-outline/40 font-headline mb-6">
            {ui.home.wordPosts.postsAbout(word)}
          </p>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          >
            {filtered.map((post) => (
              <motion.div
                key={post.slug}
                className="h-full"
                variants={{
                  hidden: { opacity: 0, scale: 0.92, filter: 'blur(4px)' },
                  show: {
                    opacity: 1,
                    scale: 1,
                    filter: 'blur(0px)',
                    transition: { type: 'spring' as const, stiffness: 400, damping: 28 },
                  },
                }}
              >
                <PostCard post={post} variant="glow" />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </section>
  )
}
