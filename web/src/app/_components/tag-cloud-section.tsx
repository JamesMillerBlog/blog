'use client'

import { Post } from '@/types/post'
import { ui } from '@/i18n/en'

type Props = {
  tags: string[]
  posts: Post[]
  selectedTag: string
  onTagSelect: (tag: string) => void
}

export function TagCloudSection({ tags, selectedTag, onTagSelect }: Props) {
  const allTags = ['All', ...tags]

  return (
    <section className="mb-16">
      <div className="mb-6">
        <h2 className="font-headline text-3xl font-extrabold text-on-surface">
          {ui.home.tagCloud.heading}
        </h2>
        <p className="font-body text-base text-on-surface-variant mt-1">
          {ui.home.tagCloud.subheading}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {allTags.map((tag) => {
          const isSelected = selectedTag === tag
          return (
            <button
              key={tag}
              onClick={() => onTagSelect(isSelected && tag !== 'All' ? 'All' : tag)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold font-headline transition-all duration-300 cursor-pointer ${
                isSelected
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
              }`}
            >
              {tag}
            </button>
          )
        })}
      </div>
    </section>
  )
}
