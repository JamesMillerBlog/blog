'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { HeroSection } from './hero-section'
import { TagCloudSection } from './tag-cloud-section'
import { FilteredPostGrid } from './filtered-post-grid'
import { WordFilteredPosts } from './word-filtered-posts'
import { Post } from '@/types/post'

type Props = {
  allPosts: Post[]
  featuredTags: string[]
}

export function HomeContent({ allPosts, featuredTags }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [heroWord, setHeroWord] = useState('software')
  const [optimisticTag, setOptimisticTag] = useState<string | null>(null)

  const routerTag = searchParams.get('tag') ?? 'Everything'
  const selectedTag = optimisticTag ?? routerTag

  const handleTagSelect = useCallback(
    (tag: string) => {
      setOptimisticTag(tag)
      if (tag !== 'Everything') setHeroWord('software')
      const params = new URLSearchParams(searchParams.toString())
      if (tag === 'Everything') {
        params.delete('tag')
      } else {
        params.set('tag', tag)
      }
      params.delete('page')
      router.replace(`/?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  return (
    <>
      <HeroSection
        word={heroWord}
        onWordChange={(word) => {
          setHeroWord(word)
          handleTagSelect('Everything')
        }}
      />
      <TagCloudSection
        tags={featuredTags}
        posts={allPosts}
        selectedTag={selectedTag}
        onTagSelect={handleTagSelect}
      />
      {selectedTag === 'Everything' && <WordFilteredPosts posts={allPosts} word={heroWord} />}
      {allPosts.length > 0 && (
        <FilteredPostGrid
          posts={allPosts}
          selectedTag={selectedTag}
          onTagSelect={handleTagSelect}
        />
      )}
    </>
  )
}
