'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Project } from '@/app/projects/data'
import { ui } from '@/i18n/en'
import { RoleCard } from './projects-role-card'
import { ProjectGrid } from './projects-grid'

const getFilteredProjects = (
  projects: Project[],
  selectedCategory: string,
  highlightsOverride?: Project[] | null
): Project[] => {
  if (selectedCategory === 'All') return projects
  if (selectedCategory === 'Highlights') {
    return (
      highlightsOverride ??
      projects.filter((p) => p.portfolio).sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
    )
  }
  return projects.filter((p) => p.category === selectedCategory)
}

export const ProjectsTimeline = ({
  projects,
  categories,
  selectedCategory: externalCategory,
  flashCategory,
  highlightsOverride,
  onCategoryChange,
}: {
  projects: Project[]
  categories: string[]
  selectedCategory?: string
  flashCategory?: string | null
  highlightsOverride?: Project[] | null
  onCategoryChange?: (category: string) => void
}): React.JSX.Element => {
  const [internalCategory, setInternalCategory] = useState<string>('Highlights')
  const [anyHovered, setAnyHovered] = useState(false)
  const selectedCategory = externalCategory ?? internalCategory
  const setSelectedCategory = onCategoryChange ?? setInternalCategory

  const isHighlights = selectedCategory === 'Highlights'
  const filteredProjects = getFilteredProjects(projects, selectedCategory, highlightsOverride)

  const years = [...new Set(filteredProjects.map((p) => p.year))].sort((a, b) => b - a)
  const byYear = years.reduce<Record<number, Project[]>>((acc, year) => {
    acc[year] = filteredProjects.filter((p) => p.year === year)
    return acc
  }, {})

  return (
    <div className="mt-10 md:mt-8">
      <div className="flex flex-wrap gap-3 mb-12 justify-center">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-1.5 font-headline transition-all duration-300 cursor-pointer ${
              selectedCategory === category
                ? 'text-on-surface font-extrabold text-base'
                : 'text-on-surface font-semibold text-sm opacity-50 hover:opacity-70'
            } ${flashCategory === category ? 'scale-110' : ''}`}
          >
            {category}
          </button>
        ))}
      </div>

      {isHighlights && (
        <div
          key={`highlights-${highlightsOverride ? highlightsOverride.map((p) => p.slug).join('-') : 'default'}`}
        >
          <ProjectGrid projects={filteredProjects} priorityFirst />
        </div>
      )}

      {!isHighlights && (
        <div className="relative ml-4 md:ml-0">
          <div
            className={`absolute inset-y-0 left-0 w-1 md:left-1/2 md:-translate-x-1/2 bg-surface-container-high transition-opacity duration-300 ${anyHovered ? 'opacity-0' : 'opacity-100'}`}
          />
          <AnimatePresence mode="popLayout">
            {years.map((year, yearIndex) => {
              const roleCards = byYear[year].filter((p) => p.type === 'role')
              const projectCards = byYear[year].filter((p) => p.type !== 'role')

              return (
                <motion.div
                  key={`${year}-${selectedCategory}`}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="mb-8"
                >
                  {roleCards.map((project, i) => (
                    <RoleCard
                      key={project.slug}
                      project={project}
                      i={i}
                      onHoverChange={setAnyHovered}
                    />
                  ))}

                  {projectCards.length > 0 && (
                    <ProjectGrid projects={projectCards} onHoverChange={setAnyHovered} />
                  )}

                  <div className="relative h-16 mt-8 flex items-center">
                    <div className="absolute left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-primary border-2 border-surface z-10 hidden md:flex items-center justify-center">
                      <span className="font-headline text-xs font-bold text-on-primary leading-none text-center">
                        {year}
                      </span>
                    </div>
                    <div className="absolute left-0 -translate-x-1/2 w-12 h-12 rounded-full bg-primary border-2 border-surface z-10 md:hidden flex items-center justify-center">
                      <span className="font-headline text-xs font-bold text-on-primary leading-none text-center">
                        {year}
                      </span>
                    </div>
                    {yearIndex < years.length - 1 && (
                      <div
                        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5"
                        style={{
                          backgroundImage:
                            'repeating-linear-gradient(to right, var(--color-outline-variant) 0, var(--color-outline-variant) 14px, transparent 14px, transparent 32px)',
                          opacity: 0.4,
                        }}
                      />
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {filteredProjects.length === 0 && (
            <div className="text-center py-12 text-on-surface-variant font-body">
              {ui.projects.empty}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
