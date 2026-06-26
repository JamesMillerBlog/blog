'use client'

import { useState, useRef } from 'react'
import { Project } from '@/app/projects/data'
import { CyclingDescription } from '@/components/ui/cycling-description'
import { CyclingHeadlineWord } from '@/components/ui/cycling-headline-word'
import { ProjectsTimeline } from './projects-timeline'
import { ui } from '@/i18n/en'

const WORD_HIGHLIGHTS: Record<string, string[]> = {
  Made: [],
  Built: ['my-other-life', 'maia', 'pay-at-pump', 'mood-tree', 'hole-in-the-wall'],
  Architected: [
    'momentum-vxi',
    'world-travel-market',
    'shift-platform',
    'future-decoded',
    'caddy-clubhouse',
    'call-the-shots',
  ],
  Launched: ['epic-mind-drive', 'champions-rally', 'cognitive-bar'],
}

export const ProjectsPageClient = ({
  projects,
  categories,
}: {
  projects: Project[]
  categories: string[]
}): React.JSX.Element => {
  const [selectedCategory, setSelectedCategory] = useState('Highlights')
  const [flashCategory, setFlashCategory] = useState<string | null>(null)
  const [highlightsOverride, setHighlightsOverride] = useState<Project[] | null>(null)
  const [headlineWord, setHeadlineWord] = useState('Made')
  const [typeFilter, setTypeFilter] = useState<'products' | 'experiences' | null>(null)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category)
    setHeadlineWord('Made')
    setHighlightsOverride(null)
    if (flashTimer.current) clearTimeout(flashTimer.current)
    if (clearTimer.current) clearTimeout(clearTimer.current)
    setFlashCategory(null)
    flashTimer.current = setTimeout(() => {
      setFlashCategory(category)
      clearTimer.current = setTimeout(() => setFlashCategory(null), 800)
    }, 150)
  }

  const handleWordChange = (word: string) => {
    setHeadlineWord(word)
    const slugs = WORD_HIGHLIGHTS[word]
    if (slugs && slugs.length > 0) {
      const subset = slugs
        .map((s) => projects.find((p) => p.slug === s))
        .filter(Boolean) as Project[]
      setHighlightsOverride(subset)
    } else {
      setHighlightsOverride(null)
    }
    setSelectedCategory('Highlights')
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    if (category !== 'Highlights') {
      setHighlightsOverride(null)
      setHeadlineWord('Made')
      setTypeFilter(null)
    }
  }

  const handleProductsClick = () => {
    if (selectedCategory === 'Highlights' && typeFilter === 'products') {
      setTypeFilter(null)
      setHighlightsOverride(null)
    } else {
      setSelectedCategory('Highlights')
      setHeadlineWord('Made')
      setTypeFilter('products')
      setHighlightsOverride(projects.filter((p) => p.portfolio && p.type === 'role'))
    }
  }

  const handleExperiencesClick = () => {
    if (selectedCategory === 'Highlights' && typeFilter === 'experiences') {
      setTypeFilter(null)
      setHighlightsOverride(null)
    } else {
      setSelectedCategory('Highlights')
      setHeadlineWord('Made')
      setTypeFilter('experiences')
      setHighlightsOverride(
        projects
          .filter((p) => p.portfolio && p.type !== 'role')
          .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
      )
    }
  }

  return (
    <>
      <section className="mb-8 md:mb-12">
        <div className="max-w-3xl">
          <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-on-surface overflow-visible">
            {ui.projects.heading}{' '}
            <CyclingHeadlineWord onWordChange={handleWordChange} word={headlineWord} />
          </h1>
        </div>
      </section>

      <CyclingDescription
        onCategorySelect={handleCategorySelect}
        onProductsClick={handleProductsClick}
        onExperiencesClick={handleExperiencesClick}
      />
      <ProjectsTimeline
        projects={projects}
        categories={categories}
        selectedCategory={selectedCategory}
        flashCategory={flashCategory}
        highlightsOverride={highlightsOverride}
        onCategoryChange={handleCategoryChange}
      />
    </>
  )
}
