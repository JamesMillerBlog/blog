'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Project } from '@/app/projects/data'
import { motion, AnimatePresence } from 'framer-motion'
import { ui } from '@/i18n/en'

const CARD_VARIANTS = {
  hidden: { opacity: 0, scale: 0.92, filter: 'blur(4px)' },
  show: (i: number) => ({
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring' as const, stiffness: 500, damping: 32, delay: i * 0.02 },
  }),
}

const ProjectCard = ({
  project,
  priority,
}: {
  project: Project
  priority?: boolean
}): React.JSX.Element => {
  const [playing, setPlaying] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const thumbUrl =
    project.image ?? `https://img.youtube.com/vi/${project.youtubeId}/maxresdefault.jpg`
  const [imgSrc, setImgSrc] = useState(thumbUrl)

  return (
    <div
      id={project.slug}
      className="group relative bg-surface-container-lowest rounded-xl p-6 hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {/* Left border accent */}
      <div className="absolute inset-y-0 left-0 w-[3px] bg-primary rounded-full scale-y-0 origin-bottom group-hover:scale-y-100 transition-transform duration-300" />

      <div className="flex items-center justify-between mb-4">
        <span className="px-3 py-1 bg-primary-container text-on-primary-container rounded-full text-xs font-bold font-headline uppercase tracking-wider">
          {project.category}
        </span>
        {project.link && (
          <a
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-headline font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:text-secondary"
            onClick={(e) => e.stopPropagation()}
          >
            View project →
          </a>
        )}
      </div>

      <h3 className="font-headline text-2xl font-bold text-on-surface mb-2">{project.title}</h3>

      <span className="text-xs font-headline font-bold text-secondary uppercase tracking-widest mb-4 block">
        {project.company}
      </span>

      <p className="text-on-surface-variant leading-relaxed mb-6 font-body">
        {project.description}
      </p>

      {/* Thumbnail → embed on click */}
      {project.youtubeId && (
        <div
          className="relative w-full aspect-video rounded-lg overflow-hidden bg-surface-container-low mb-6 cursor-pointer"
          onClick={() => setPlaying(true)}
        >
          {playing ? (
            <iframe
              src={`https://www.youtube.com/embed/${project.youtubeId}?autoplay=1`}
              title={project.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
          ) : (
            <>
              {/* Skeleton shown until image loads */}
              {!imageLoaded && (
                <div className="absolute inset-0 bg-surface-container animate-pulse" />
              )}
              <Image
                src={imgSrc}
                alt={project.title}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImgSrc(`https://img.youtube.com/vi/${project.youtubeId}/hqdefault.jpg`)
                  setImageLoaded(true)
                }}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={priority}
                className={`object-cover transition-all duration-500 group-hover:scale-[1.02] ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              />
              {imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    <svg
                      className="w-5 h-5 text-gray-900 ml-1"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 bg-surface-container text-on-surface rounded-full text-xs font-medium font-headline"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
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
  const selectedCategory = externalCategory ?? internalCategory
  const setSelectedCategory = onCategoryChange ?? setInternalCategory

  const isHighlights = selectedCategory === 'Highlights'

  const filteredProjects =
    selectedCategory === 'All'
      ? projects
      : isHighlights
        ? (highlightsOverride ??
          projects.filter((p) => p.portfolio).sort((a, b) => (a.order ?? 99) - (b.order ?? 99)))
        : projects.filter((p) => p.category === selectedCategory)

  const years = [...new Set(filteredProjects.map((p) => p.year))].sort((a, b) => b - a)
  const byYear = years.reduce<Record<number, Project[]>>((acc, year) => {
    acc[year] = filteredProjects.filter((p) => p.year === year)
    return acc
  }, {})

  const globalIndex: Record<string, number> = {}
  let counter = 0
  years.forEach((year) => {
    byYear[year].forEach((project) => {
      globalIndex[project.slug] = counter++
    })
  })

  return (
    <div className="mt-10 md:mt-8">
      <div className="flex flex-wrap gap-3 mb-12 justify-center">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-1.5 rounded-full text-sm font-headline font-semibold transition-all duration-300 cursor-pointer ${
              selectedCategory === category
                ? 'bg-secondary-container text-on-secondary-container'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
            } ${flashCategory === category ? 'scale-110 ring-2 ring-secondary' : ''}`}
          >
            {category}
          </button>
        ))}
      </div>

      {isHighlights && (
        <div
          key={`highlights-${highlightsOverride ? highlightsOverride.map((p) => p.slug).join('-') : 'default'}`}
        >
          <div className="flex flex-col gap-6 md:hidden">
            {filteredProjects.map((project, i) => (
              <motion.div
                key={project.slug}
                custom={i}
                variants={CARD_VARIANTS}
                initial="hidden"
                animate="show"
              >
                <ProjectCard project={project} priority={i === 0} />
              </motion.div>
            ))}
          </div>
          <div className="hidden md:flex gap-6 items-start">
            <div className="flex-1 flex flex-col gap-6">
              {filteredProjects
                .filter((_, i) => i % 2 === 0)
                .map((project) => {
                  const i = filteredProjects.indexOf(project)
                  return (
                    <motion.div
                      key={project.slug}
                      custom={i}
                      variants={CARD_VARIANTS}
                      initial="hidden"
                      animate="show"
                    >
                      <ProjectCard project={project} priority={i === 0} />
                    </motion.div>
                  )
                })}
            </div>
            <div className="flex-1 flex flex-col gap-6 mt-20">
              {filteredProjects
                .filter((_, i) => i % 2 === 1)
                .map((project) => {
                  const i = filteredProjects.indexOf(project)
                  return (
                    <motion.div
                      key={project.slug}
                      custom={i}
                      variants={CARD_VARIANTS}
                      initial="hidden"
                      animate="show"
                    >
                      <ProjectCard project={project} />
                    </motion.div>
                  )
                })}
            </div>
          </div>
        </div>
      )}

      {!isHighlights && (
        <div className="relative border-l-4 border-surface-container-high ml-4 md:ml-0 md:border-l-0 md:before:absolute md:before:inset-y-0 md:before:left-1/2 md:before:w-1 md:before:bg-surface-container-high md:before:-ml-0.5">
          <AnimatePresence mode="popLayout">
            {years.map((year, yearIndex) => {
              const leftProjects = byYear[year].filter((p) => globalIndex[p.slug] % 2 === 0)
              const rightProjects = byYear[year].filter((p) => globalIndex[p.slug] % 2 === 1)
              const firstGi = globalIndex[byYear[year][0].slug]
              const firstIsLeft = firstGi % 2 === 0

              return (
                <motion.div
                  key={`${year}-${selectedCategory}`}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="mb-20"
                >
                  <div className="relative h-16 mb-10 flex items-center">
                    {yearIndex > 0 && (
                      <div
                        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5"
                        style={{
                          backgroundImage:
                            'repeating-linear-gradient(to right, var(--color-outline-variant) 0, var(--color-outline-variant) 14px, transparent 14px, transparent 32px)',
                          opacity: 0.4,
                        }}
                      />
                    )}
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
                  </div>

                  <div className="flex flex-col gap-6 md:hidden">
                    {byYear[year].map((project) => (
                      <motion.div
                        key={project.slug}
                        custom={globalIndex[project.slug]}
                        variants={CARD_VARIANTS}
                      >
                        <ProjectCard project={project} />
                      </motion.div>
                    ))}
                  </div>

                  <div className="hidden md:flex gap-6 items-start">
                    <div className={`flex-1 flex flex-col gap-6 ${firstIsLeft ? '' : 'mt-20'}`}>
                      {leftProjects.map((project) => (
                        <motion.div
                          key={project.slug}
                          custom={globalIndex[project.slug]}
                          variants={CARD_VARIANTS}
                        >
                          <ProjectCard project={project} />
                        </motion.div>
                      ))}
                    </div>
                    <div className={`flex-1 flex flex-col gap-6 ${firstIsLeft ? 'mt-20' : ''}`}>
                      {rightProjects.map((project) => (
                        <motion.div
                          key={project.slug}
                          custom={globalIndex[project.slug]}
                          variants={CARD_VARIANTS}
                        >
                          <ProjectCard project={project} />
                        </motion.div>
                      ))}
                    </div>
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
