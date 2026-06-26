'use client'

import { useRouter } from 'next/navigation'
import type { Project } from '@/app/projects/data'
import { ui } from '@/i18n/en'
import { ProjectTagBadge } from './project-tag-badge'
import { CardPlaceholderContent, VideoSection } from './projects-card-media'

const typeAccentClass = (type: string | undefined) =>
  type === 'role' ? 'bg-secondary' : 'bg-primary'

const typeBadgeClass = (type: string | undefined) =>
  type === 'role'
    ? 'bg-secondary-container text-on-secondary-container'
    : 'bg-primary-container text-on-primary-container'

const typeTextClass = (type: string | undefined) =>
  type === 'role' ? 'text-secondary' : 'text-primary'

const ProjectCardFullWidth = ({ project, priority }: { project: Project; priority?: boolean }) => {
  const router = useRouter()

  return (
    <div
      id={project.slug}
      onClick={() => router.push(`/projects/${project.slug}`)}
      className="group relative bg-surface-container-lowest rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
    >
      <div
        className={`absolute inset-y-0 left-0 w-[3px] rounded-full scale-y-0 origin-bottom group-hover:scale-y-100 transition-transform duration-300 ${typeAccentClass(project.type)}`}
      />

      <div className="p-6 flex flex-col md:flex-row md:gap-10">
        <div className="md:w-[48%] shrink-0 mb-6 md:mb-0 flex flex-col">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold font-headline uppercase tracking-wider self-start mb-4 ${typeBadgeClass(project.type)}`}
          >
            {project.category}
          </span>
          <h3 className="ds-card-title mb-1">{project.title}</h3>
          <span
            className={`text-xs font-headline font-bold uppercase tracking-widest block mb-3 ${typeTextClass(project.type)}`}
          >
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
          {project.youtubeId ? (
            <VideoSection
              youtubeId={project.youtubeId}
              title={project.title}
              initialSrc={project.image}
              priority={priority}
              hoverScale
            />
          ) : (
            <CardPlaceholderContent />
          )}
        </div>
      </div>
    </div>
  )
}

const ProjectCardGrid = ({ project, priority }: { project: Project; priority?: boolean }) => {
  const router = useRouter()

  return (
    <div
      id={project.slug}
      onClick={() => router.push(`/projects/${project.slug}`)}
      className="group relative bg-surface-container-lowest rounded-xl p-6 hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
    >
      <div
        className={`absolute inset-y-0 left-0 w-[3px] rounded-full scale-y-0 origin-bottom group-hover:scale-y-100 transition-transform duration-300 ${typeAccentClass(project.type)}`}
      />

      <div className="flex items-center justify-between mb-4">
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold font-headline uppercase tracking-wider ${typeBadgeClass(project.type)}`}
        >
          {project.category}
        </span>
      </div>

      <h3 className="font-headline text-2xl font-bold text-on-surface mb-1">{project.title}</h3>
      <span
        className={`text-xs font-headline font-bold uppercase tracking-widest block mb-3 ${typeTextClass(project.type)}`}
      >
        / {ui.projects.typeLabel(project.type ?? '')}
      </span>

      <p className="text-on-surface-variant leading-relaxed mb-6 font-body">
        {project.description}
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {project.tags.map((tag) => (
          <ProjectTagBadge key={tag} tag={tag} />
        ))}
      </div>

      {project.youtubeId && (
        <VideoSection
          youtubeId={project.youtubeId}
          title={project.title}
          initialSrc={project.image}
          priority={priority}
          hoverScale
        />
      )}
    </div>
  )
}

export const ProjectCard = ({
  project,
  priority,
  isFullWidth,
}: {
  project: Project
  priority?: boolean
  isFullWidth?: boolean
}) => {
  if (isFullWidth) return <ProjectCardFullWidth project={project} priority={priority} />
  return <ProjectCardGrid project={project} priority={priority} />
}
