import { projects } from '@/app/projects/data'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { VideoPlayer } from '@/app/projects/_components/video-player'
import { ProjectTagBadge } from '@/app/projects/_components/project-tag-badge'

export async function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = projects.find((p) => p.slug === slug)
  if (!project) return {}
  return { title: project.title, description: project.description }
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = projects.find((p) => p.slug === slug)
  if (!project) notFound()

  return (
    <main className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-xs font-headline font-semibold text-on-surface opacity-50 hover:opacity-100 transition-opacity mb-10"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        All projects
      </Link>

      <div className="bg-surface-container-lowest rounded p-8 md:p-12 mb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold font-headline uppercase tracking-wider ${project.type === 'role' ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-container text-on-primary-container'}`}
            >
              {project.category}
            </span>
            {project.period && (
              <p className="text-xs font-headline font-bold text-secondary uppercase tracking-widest mt-4 mb-2">
                {project.period}
              </p>
            )}
            <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-on-surface mb-1 mt-4">
              {project.title}
            </h1>
            <span
              className={`text-xs font-headline font-bold uppercase tracking-widest block ${project.type === 'role' ? 'text-secondary' : 'text-primary'}`}
            >
              / {project.type === 'role' ? 'Product' : 'Experience'}
            </span>
          </div>
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="self-start inline-flex items-center gap-2 px-4 py-2 border-2 border-on-surface text-on-surface rounded-full text-sm font-headline font-semibold hover:bg-on-surface hover:text-surface transition-all shrink-0"
            >
              Visit site
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-outline-variant">
          <p className="text-on-surface-variant leading-relaxed font-body text-lg">
            {project.description}
          </p>
          <div>
            <p className="text-xs font-headline font-bold text-on-surface-variant uppercase tracking-widest mb-3">
              Built with
            </p>
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <ProjectTagBadge
                  key={tag}
                  tag={tag}
                  className="px-3 py-1.5 bg-surface-container text-on-surface rounded-full text-xs font-medium font-headline"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <VideoPlayer project={project} priority />
    </main>
  )
}
