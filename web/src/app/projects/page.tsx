import { Metadata } from 'next'
import { projects, getCategories } from '@/app/projects/data'
import { ProjectsTimeline } from '@/app/projects/_components/projects-timeline'
import { ui } from '@/i18n/en'

export const metadata: Metadata = {
  title: 'Projects',
  description: ui.projects.description,
}

export default function ProjectsPage() {
  const categories = getCategories()

  return (
    <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="mb-8 md:mb-12">
        <div className="max-w-3xl">
          <h1 className="font-headline text-5xl md:text-7xl font-extrabold text-on-background tracking-tight mb-6">
            {ui.projects.heading}{' '}
            <span className="text-primary italic">{ui.projects.headingEmphasis}</span>
          </h1>
          <p className="text-xl md:text-2xl text-on-surface-variant leading-relaxed mb-4">
            {ui.projects.description}
          </p>
        </div>
      </section>

      {/* Projects Timeline Filter & Layout */}
      <ProjectsTimeline projects={projects} categories={categories} />
    </main>
  )
}
