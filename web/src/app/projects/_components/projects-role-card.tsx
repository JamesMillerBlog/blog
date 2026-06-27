'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import Link from 'next/link'
import type { Project } from '@/app/projects/data'
import { ui } from '@/i18n/en'
import { ProjectTagBadge } from './project-tag-badge'
import { CARD_VARIANTS, CardPlaceholderContent } from './projects-card-media'

export const RoleCard = ({
  project,
  i,
  onHoverChange,
}: {
  project: Project
  i: number
  onHoverChange?: (h: boolean) => void
}) => {
  const [playing, setPlaying] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const thumbUrl =
    project.image ??
    (project.youtubeId ? `https://img.youtube.com/vi/${project.youtubeId}/maxresdefault.jpg` : null)
  const [imgSrc, setImgSrc] = useState(thumbUrl)

  const videoSection = project.youtubeId && (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-surface-container-low">
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
            <button
              type="button"
              aria-label={`Play video: ${project.title}`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setPlaying(true)
              }}
              className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-on-surface/90 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-surface ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </button>
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
      <Link
        href={`/projects/${project.slug}`}
        className="group relative rounded-xl overflow-hidden bg-surface-container-lowest hover:shadow-xl transition-all duration-300 block"
      >
        <div className="absolute inset-y-0 left-0 w-[3px] bg-secondary rounded-full scale-y-0 origin-bottom group-hover:scale-y-100 transition-transform duration-300" />

        <div className="p-6 md:p-8 flex flex-col md:flex-row md:gap-16">
          <div className="md:w-[48%] shrink-0 mb-6 md:mb-0 flex flex-col">
            <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold font-headline uppercase tracking-wider self-start mb-4">
              {project.category}
            </span>
            <h3 className="ds-card-title mb-1">{project.title}</h3>
            <span className="text-xs font-headline font-bold text-secondary uppercase tracking-widest block mb-3">
              / {ui.projects.typeLabel(project.type ?? '')}
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

          <div className="hidden md:flex md:flex-1 flex-col justify-center">
            {videoSection ?? <CardPlaceholderContent />}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
