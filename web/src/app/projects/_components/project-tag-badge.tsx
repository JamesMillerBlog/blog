'use client'

import { useRouter } from 'next/navigation'
import { PROJECT_TAG_TO_FEATURED } from '@/common/consts/constants'

export const ProjectTagBadge = ({ tag, className }: { tag: string; className?: string }) => {
  const router = useRouter()
  const featuredTag = PROJECT_TAG_TO_FEATURED[tag]
  const base =
    className ??
    'px-3 py-1 bg-surface-container text-on-surface rounded-full text-xs font-medium font-headline'

  if (featuredTag) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation()
          router.push(`/?tag=${encodeURIComponent(featuredTag)}`)
        }}
        className={`${base} opacity-70 hover:opacity-100 hover:bg-surface-container-high transition-all cursor-pointer`}
      >
        {tag}
      </button>
    )
  }

  return <span className={base}>{tag}</span>
}
