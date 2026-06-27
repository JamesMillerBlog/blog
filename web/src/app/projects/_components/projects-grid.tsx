'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Project } from '@/app/projects/data'
import { CARD_VARIANTS } from './projects-card-media'
import { ProjectCard } from './projects-project-card'

export const ProjectGrid = ({
  projects,
  priorityFirst,
  onHoverChange,
}: {
  projects: Project[]
  priorityFirst?: boolean
  onHoverChange?: (h: boolean) => void
}) => {
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
      <div className="md:hidden flex flex-col gap-6">
        {projects.map((p, i) => cardMotion(p, i, false))}
      </div>

      <div className="hidden md:flex gap-6 items-start">
        <div className="flex-1 flex flex-col gap-6">
          {leftProjects.map((p) => cardMotion(p, mainProjects.indexOf(p)))}
        </div>
        <div className="flex-1 flex flex-col gap-6 mt-12">
          {rightProjects.map((p) => cardMotion(p, mainProjects.indexOf(p)))}
        </div>
      </div>

      {fullWidthProject && (
        <div className="hidden md:block mt-6">
          {cardMotion(fullWidthProject, projects.length - 1, true)}
        </div>
      )}
    </div>
  )
}
