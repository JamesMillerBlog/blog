'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Project } from '@/app/projects/data'
import { motion, AnimatePresence } from 'framer-motion'
import { ui } from '@/i18n/en'
import { ProjectTagBadge } from './project-tag-badge'

const CARD_VARIANTS = {
  hidden: { opacity: 0, scale: 0.92, filter: 'blur(4px)' },
  show: (i: number) => ({
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring' as const, stiffness: 500, damping: 32, delay: i * 0.02 },
  }),
}

function RoleCard({
  project,
  i,
  onHoverChange,
}: {
  project: Project
  i: number
  onHoverChange?: (h: boolean) => void
}) {
  const router = useRouter()
  const [playing, setPlaying] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const thumbUrl =
    project.image ??
    (project.youtubeId ? `https://img.youtube.com/vi/${project.youtubeId}/maxresdefault.jpg` : null)
  const [imgSrc, setImgSrc] = useState(thumbUrl)

  const videoSection = project.youtubeId && (
    <div
      className="relative w-full aspect-video rounded-lg overflow-hidden bg-surface-container-low cursor-pointer"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setPlaying(true)
      }}
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
          {!imageLoaded && <div className="absolute inset-0 bg-surface-container animate-pulse" />}
          {imgSrc && (
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
              className={`object-cover transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          )}
          {imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
              <div className="w-14 h-14 rounded-full bg-on-surface/90 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-surface ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )

  return (
    <motion.div
      custom={i}
      variants={CARD_VARIANTS}
      initial="hidden"
      animate="show"
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      className="mb-6 transition-transform duration-300 hover:scale-[1.02]"
    >
      <div
        onClick={() => router.push(`/projects/${project.slug}`)}
        className="group relative rounded-xl overflow-hidden bg-surface-container-lowest hover:shadow-xl transition-all duration-300 cursor-pointer"
      >
        {/* Left border accent — secondary/pink for products */}
        <div className="absolute inset-y-0 left-0 w-[3px] bg-secondary rounded-full scale-y-0 origin-bottom group-hover:scale-y-100 transition-transform duration-300" />

        <div className="p-6 md:p-8 flex flex-col md:flex-row md:gap-16">
          {/* Left — identity + content */}
          <div className="md:w-[48%] shrink-0 mb-6 md:mb-0 flex flex-col">
            <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold font-headline uppercase tracking-wider self-start mb-4">
              {project.category}
            </span>
            <h3 className="ds-card-title mb-1">{project.title}</h3>
            <span className="text-xs font-headline font-bold text-secondary uppercase tracking-widest block mb-3">
              / Product
            </span>
            <p className="text-on-surface-variant leading-relaxed font-body text-lg mb-6">
              {project.description}
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {project.tags.map((tag) => (
                <ProjectTagBadge key={tag} tag={tag} />
              ))}
            </div>
          </div>

          {/* Right — video if available, otherwise placeholder */}
          <div className="hidden md:flex md:flex-1 flex-col justify-center">
            {videoSection ?? (
              <div className="flex flex-col gap-3 px-4">
                <div className="w-full h-3 rounded-full bg-surface-container-high opacity-50" />
                <div className="w-4/5 h-3 rounded-full bg-surface-container-high opacity-40" />
                <div className="w-full h-3 rounded-full bg-surface-container-high opacity-50 mt-2" />
                <div className="w-3/5 h-3 rounded-full bg-surface-container-high opacity-30" />
                <div className="w-4/5 h-3 rounded-full bg-surface-container-high opacity-40" />
                <div className="w-full h-3 rounded-full bg-surface-container-high opacity-50 mt-2" />
                <div className="w-2/3 h-3 rounded-full bg-surface-container-high opacity-30" />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function ProjectCard({
  project,
  priority,
  isFullWidth,
}: {
  project: Project
  priority?: boolean
  isFullWidth?: boolean
}) {
  const router = useRouter()
  const [playing, setPlaying] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const thumbUrl =
    project.image ?? `https://img.youtube.com/vi/${project.youtubeId}/maxresdefault.jpg`
  const [imgSrc, setImgSrc] = useState(thumbUrl)

  const videoSection = project.youtubeId && (
    <div
      className="relative w-full aspect-video rounded-lg overflow-hidden bg-surface-container-low cursor-pointer"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setPlaying(true)
      }}
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
          {!imageLoaded && <div className="absolute inset-0 bg-surface-container animate-pulse" />}
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
              <div className="w-14 h-14 rounded-full bg-on-surface/90 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-surface ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )

  if (isFullWidth) {
    return (
      <div
        id={project.slug}
        onClick={() => router.push(`/projects/${project.slug}`)}
        className="group relative bg-surface-container-lowest rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
      >
        {/* Left border accent — pink for products, teal for experiences */}
        <div
          className={`absolute inset-y-0 left-0 w-[3px] rounded-full scale-y-0 origin-bottom group-hover:scale-y-100 transition-transform duration-300 ${project.type === 'role' ? 'bg-secondary' : 'bg-primary'}`}
        />

        <div className="p-6 flex flex-col md:flex-row md:gap-10">
          {/* Left — identity + content */}
          <div className="md:w-[48%] shrink-0 mb-6 md:mb-0 flex flex-col">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold font-headline uppercase tracking-wider self-start mb-4 ${project.type === 'role' ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-container text-on-primary-container'}`}
            >
              {project.category}
            </span>
            <h3 className="ds-card-title mb-1">{project.title}</h3>
            <span
              className={`text-xs font-headline font-bold uppercase tracking-widest block mb-3 ${project.type === 'role' ? 'text-secondary' : 'text-primary'}`}
            >
              / {project.type === 'role' ? 'Product' : 'Experience'}
            </span>
            <p className="text-on-surface-variant leading-relaxed font-body text-lg mb-6">
              {project.description}
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {project.tags.map((tag) => (
                <ProjectTagBadge key={tag} tag={tag} />
              ))}
            </div>
          </div>

          {/* Right — video if available, otherwise placeholder */}
          <div className="hidden md:flex md:flex-1 flex-col justify-center">
            {videoSection ?? (
              <div className="flex flex-col gap-3 px-4">
                <div className="w-full h-3 rounded-full bg-surface-container-high opacity-50" />
                <div className="w-4/5 h-3 rounded-full bg-surface-container-high opacity-40" />
                <div className="w-full h-3 rounded-full bg-surface-container-high opacity-50 mt-2" />
                <div className="w-3/5 h-3 rounded-full bg-surface-container-high opacity-30" />
                <div className="w-4/5 h-3 rounded-full bg-surface-container-high opacity-40" />
                <div className="w-full h-3 rounded-full bg-surface-container-high opacity-50 mt-2" />
                <div className="w-2/3 h-3 rounded-full bg-surface-container-high opacity-30" />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      id={project.slug}
      onClick={() => router.push(`/projects/${project.slug}`)}
      className="group relative bg-surface-container-lowest rounded-xl p-6 hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
    >
      {/* Left border accent — pink for products, teal for experiences */}
      <div
        className={`absolute inset-y-0 left-0 w-[3px] rounded-full scale-y-0 origin-bottom group-hover:scale-y-100 transition-transform duration-300 ${project.type === 'role' ? 'bg-secondary' : 'bg-primary'}`}
      />

      <div className="flex items-center justify-between mb-4">
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold font-headline uppercase tracking-wider ${project.type === 'role' ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-container text-on-primary-container'}`}
        >
          {project.category}
        </span>
      </div>

      <h3 className="font-headline text-2xl font-bold text-on-surface mb-1">{project.title}</h3>
      <span
        className={`text-xs font-headline font-bold uppercase tracking-widest block mb-3 ${project.type === 'role' ? 'text-secondary' : 'text-primary'}`}
      >
        / {project.type === 'role' ? 'Product' : 'Experience'}
      </span>

      <p className="text-on-surface-variant leading-relaxed mb-6 font-body">
        {project.description}
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {project.tags.map((tag) => (
          <ProjectTagBadge key={tag} tag={tag} />
        ))}
      </div>

      {videoSection && <div>{videoSection}</div>}
    </div>
  )
}

function ProjectGrid({
  projects,
  priorityFirst,
  onHoverChange,
}: {
  projects: Project[]
  priorityFirst?: boolean
  onHoverChange?: (h: boolean) => void
}) {
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null)

  const isOdd = projects.length % 2 === 1
  const mainProjects = isOdd ? projects.slice(0, -1) : projects
  const fullWidthProject = isOdd ? projects[projects.length - 1] : null

  const leftProjects = mainProjects.filter((_, i) => i % 2 === 0)
  const rightProjects = mainProjects.filter((_, i) => i % 2 === 1)

  const cardMotion = (project: Project, globalIndex: number, isFullWidth = false) => {
    const scale =
      hoveredSlug === null
        ? 'scale-100'
        : hoveredSlug === project.slug
          ? 'scale-[1.02]'
          : 'scale-[0.97]'
    return (
      <motion.div
        key={project.slug}
        custom={globalIndex}
        variants={CARD_VARIANTS}
        initial="hidden"
        animate="show"
        onMouseEnter={() => {
          setHoveredSlug(project.slug)
          onHoverChange?.(true)
        }}
        onMouseLeave={() => {
          setHoveredSlug(null)
          onHoverChange?.(false)
        }}
        className={`transition-transform duration-300 ${scale}`}
      >
        <ProjectCard
          project={project}
          priority={priorityFirst && globalIndex === 0}
          isFullWidth={isFullWidth}
        />
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col gap-6 md:block">
      {/* Mobile: single column */}
      <div className="md:hidden flex flex-col gap-6">
        {projects.map((p, i) => cardMotion(p, i, false))}
      </div>

      {/* Desktop: two independent flex columns */}
      <div className="hidden md:flex gap-6 items-start">
        <div className="flex-1 flex flex-col gap-6">
          {leftProjects.map((p) => cardMotion(p, mainProjects.indexOf(p)))}
        </div>
        <div className="flex-1 flex flex-col gap-6 mt-12">
          {rightProjects.map((p) => cardMotion(p, mainProjects.indexOf(p)))}
        </div>
      </div>

      {/* Full-width last card for odd counts */}
      {fullWidthProject && (
        <div className="hidden md:block mt-6">
          {cardMotion(fullWidthProject, projects.length - 1, true)}
        </div>
      )}
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
  const [anyHovered, setAnyHovered] = useState(false)
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
          {/* Vertical line */}
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
                  {/* Role cards — always full width */}
                  {roleCards.map((project, i) => (
                    <RoleCard
                      key={project.slug}
                      project={project}
                      i={i}
                      onHoverChange={setAnyHovered}
                    />
                  ))}

                  {/* Project cards — half or full width based on pairing */}
                  {projectCards.length > 0 && (
                    <ProjectGrid projects={projectCards} onHoverChange={setAnyHovered} />
                  )}

                  {/* Year label — below section content */}
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
